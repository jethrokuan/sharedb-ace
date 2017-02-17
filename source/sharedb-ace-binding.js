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
    this.logger = new Logdown({ prefix: 'shareace' });

    // Event Listeners
    this.$onLocalChange = this.onLocalChange.bind(this);
    this.$onRemoteChange = this.onRemoteChange.bind(this);

    this.setInitialValue();
    this.listen();
  }

  setInitialValue() {
    this.suppress = true;
    this.session.setValue(this.doc.data[this.path[0]]);
    this.suppress = false;
  }

  listen() {
    this.session.on('change', this.$onLocalChange);
    this.doc.on('op', this.$onRemoteChange);
  }

  /**
   * @param delta - delta that ace editor produces upon changes
   * eg. {'start':{'row':5,'column':1},'end':{'row':5,'column':2},'action':'insert','lines':['d']}
   */
  deltaTransform(delta) {
    const aceDoc = this.session.getDocument();
    const op = {};
    const start = aceDoc.positionToIndex(delta.start);
    const end = aceDoc.positionToIndex(delta.end);
    op.p = this.path.concat(start);
    this.logger.log(`start: ${start} end: ${end}`);
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
  opTransform(ops) {
    const self = this;
    const deltas = [];
    ops.forEach((op) => {
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

      const count = lines.reduce((total, line) => total + line.length, lines.length - 1);
      self.logger.log(`*count*: ${count}`);

      const start = pos;
      const end = self.session.doc.indexToPosition(index + count, 0);

      const delta = {
        start,
        end,
        action,
        lines,
      };
      deltas.push(delta);
    });
    return deltas;
  }

  onLocalChange(delta) {
    this.logger.log(`*local*: fired ${Date.now()}`);
    this.logger.log(`*local*: delta received: ${JSON.stringify(delta)}`);

    if (this.suppress) {
      this.logger.log('*local*: local delta, _skipping_');
      return;
    }
    const op = this.deltaTransform(delta);
    this.logger.log(`*local*: transformed op: ${JSON.stringify(op)}`);

    const docSubmitted = (err) => {
      if (err) throw err;
      this.logger.log('*local*: op submitted');
    };

    this.doc.submitOp(op, { source: this }, docSubmitted);
  }

  onRemoteChange(ops, source) {
    this.logger.log(`*remote*: fired ${Date.now()}`);
    const self = this;

    if (source === self) {
      this.logger.log('*remote*: op origin is self; _skipping_');
      return;
    }

    const deltas = this.opTransform(ops);
    this.logger.log(`*remote*: op received: ${JSON.stringify(ops)}`);
    this.logger.log(`*remote*: transformed delta: ${JSON.stringify(deltas)}`);

    self.suppress = true;
    self.session.getDocument().applyDeltas(deltas);
    self.suppress = false;

    this.logger.log('*remote*: session value');
    this.logger.log(JSON.stringify(this.session.getValue()));
    this.logger.log('*remote*: delta applied');
  }
}

export default SharedbAceBinding;
