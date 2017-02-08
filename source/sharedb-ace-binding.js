import Logdown from 'logdown';

class SharedbAceBinding {
  constructor(aceInstance, path, doc) {
    this.editor = aceInstance;
    this.editor.$blockScrolling = Infinity;
    this.session = aceInstance.getSession();
    this.newline = this.session.getDocument().getNewLineCharacter();
    this.path = path;
    this.doc = doc;
    this.suppress = false;
    this.setup();
    this.logger = new Logdown({ prefix: 'shareace' });
  }

  setup() {
    const self = this;
    // Set initial data
    self.suppress = true;
    self.session.setValue(self.doc.data[self.path[0]]);
    self.suppress = false;

    self.session.removeAllListeners('change');
    self.doc.removeAllListeners('op');
    // self.session.on('change', self.onLocalChange.call(self));

    self.$onLocalChange = self.onLocalChange.bind(self);
    self.$onRemoteChange = self.onRemoteChange.bind(self);
    self.session.on('change', self.$onLocalChange);

    self.doc.on('op', self.$onRemoteChange);
  }

  /**
   * @param delta - delta that ace editor produces upon changes
   * eg. {'start':{'row':5,'column':1},'end':{'row':5,'column':2},'action':'insert','lines':['d']}
   */
  deltaTransform(delta) {
    const aceDoc = this.session.getDocument();
    const op = {};
    op.p = this.path.concat(aceDoc.positionToIndex(delta.start));
    let action;
    if (delta.action === 'insert') {
      action = 'si';
    } else if (delta.action === 'remove') {
      action = 'sd';
    } else {
      throw new Error(`action ${action} not supported`);
    }

    const str = delta.lines.join('\n');

    op[action] = str;
    return op;
  }

  /**
   * @param op - op that sharedb returns
   * eg. [{'p':[4],'sd':'e'}]
   */
  opTransform(op) {
    const self = this;
    const index = op.p[op.p.length - 1];
    const pos = self.session.doc.indexToPosition(index, 0);
    let action;
    let lines;

    if ('sd' in op) {
      action = 'remove';
      lines = op.sd.split('\n');
    } else if ('si' in op) {
      action = 'insert';
      lines = op.si.split('\n');
    } else {
      throw new Error(`Invalid Operation: ${JSON.stringify(op)}`);
    }

    const count = lines.reduce((total, line) => total + line.length, 0) + (lines.length - 1);

    const start = pos;
    const end = self.session.doc.indexToPosition(index + count, 0);

    const delta = {
      start,
      end,
      action,
      lines,
    };
    return delta;
  }

  onLocalChange(delta) {
    this.logger.log(`*localevent*: fired ${Date.now()}`);
    // Rerender the whole document
    this.repaint();

    // this.editor._signal("change", delta);

    // Update cursor because tab characters can influence the cursor position.
    this.editor.$cursorChange();
    this.editor.$updateHighlightActiveLine();

    if (this.suppress) return;
    const op = this.deltaTransform(delta);
    this.logger.log(`*localevent*: delta received: ${JSON.stringify(delta)}`);
    this.logger.log(`*localevent*: transformed op: ${JSON.stringify(op)}`);

    const docSubmitted = (err) => {
      if (err) throw err;
      this.logger.log('*localevent*: op submitted');
    };

    this.doc.submitOp(op, { source: this }, docSubmitted);
  }

  // Repaint the whole document
  // TODO: optimize, only repaint from start row onwards
  repaint() {
    const wrap = this.editor.session.$useWrapMode;
    const lastRow = this.session.getDocument().getLength() - 1;
    this.logger.log(`*repaint*: lines 0 to ${lastRow}`);
    this.editor.renderer.updateLines(0, lastRow, wrap);
  }

  onRemoteChange(ops, source) {
    this.logger.log(`*remoteevent*: fired ${Date.now()}`);
    const self = this;

    if (source === self) {
      this.logger.log('*remoteevent*: op origin is self; _skipping_');
      return;
    }
    const deltas = [];
    ops.forEach(op => deltas.push(self.opTransform(op)));
    this.logger.log(`*remoteevent*: op received: ${JSON.stringify(ops)}`);
    this.logger.log(`*remoteevent*: transformed delta: ${JSON.stringify(deltas)}`);

    self.suppress = true;
    self.session.getDocument().applyDeltas(deltas);
    self.suppress = false;
    this.logger.log('*remoteevent*: delta applied');

    self.repaint();
  }
}

export default SharedbAceBinding;
