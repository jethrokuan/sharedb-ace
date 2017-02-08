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

    self.session.on('change', self.onLocalChange.bind(self));

    self.doc.on('op', self.onRemoteChange.bind(self));
  }

  /**
   * @param delta - delta that ace editor produces upon changes
   * eg. {'start':{'row':5,'column':1},'end':{'row':5,'column':2},'action':'insert','lines':['d']}
   */
  deltaTransform(delta) {
    const aceDoc = this.sfession.getDocument();
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
    console.log(JSON.stringify(str));
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

    let count = 0;
    for (const line of lines) {
      count += lines[line].length;
    }
    count += lines.length - 1;

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
    const self = this;

    // Rerender the whole document
    self.repaint();

    // self.editor._signal("change", delta);

    // Update cursor because tab characters can influence the cursor position.
    self.editor.$cursorChange();
    self.editor.$updateHighlightActiveLine();

    if (self.suppress) return;
    const op = self.deltaTransform(delta);

    const docSubmitted = (err) => {
      if (err) throw err;
    };

    self.doc.submitOp(op, { source: self }, docSubmitted);
  }

  // Repaint the whole document
  // TODO: optimize, only repaint from start row onwards
  repaint() {
    const wrap = this.editor.session.$useWrapMode;
    const lastRow = this.session.getDocument().getLength() - 1;
    console.log(`Repainting: lines 0 to ${lastRow}`);
    this.editor.renderer.updateLines(0, lastRow, wrap);
  }

  onRemoteChange(ops, source) {
    const self = this;
    console.log('remove event fired');
    if (source === self) return;
    const deltas = [];
    for (const op of ops) {
      deltas.push(self.opTransform(op));
    }
    self.suppress = true;
    self.session.getDocument().applyDeltas(deltas);
    self.suppress = false;
    self.repaint();
  }
}

export default sharedbAceBinding;
