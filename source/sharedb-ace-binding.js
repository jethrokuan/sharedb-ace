class sharedbAceBinding {
  constructor(aceInstance, path, doc) {
    this.editor = aceInstance;
    this.session = aceInstance.getSession(); 
    this.path = path;
    this.doc = doc; 
    this.setup(); 
  }

  setup() {
    const self = this;
    // Set initial data 
    self.session.setValue(self.doc.data[self.path[0]]); 
    // self.session.removeAllListeners('change');
    self.session.on('change', function(delta) {
      const op = self.deltaTransform(delta); 
      // set source to self
      self.doc.submitOp(op, {source: self}, function(err) {
        if (err) throw err;
        console.log(err);
      });
    });
    self.doc.on('op', function(ops, source) {
      if (source === self) return;
      console.log("received op"); 
      const deltas = [];
      for (const op of ops) {
        console.log(op);
        deltas.push(self.opTransform(op));
      }
      console.log(deltas);
      self.session.getDocument().applyDeltas(deltas);
    }); 
  }
  
  /**
   * @param delta - delta that ace editor produces upon changes
   * eg. {'start':{'row':5,'column':1},'end':{'row':5,'column':2},'action':'insert','lines':['d']}
   */
  deltaTransform(delta) {
    // TODO: add path 
    const aceDoc = this.session.getDocument(); 
    const op = {};
    op.p = this.path.concat(aceDoc.positionToIndex(delta.start));
    let action;
    if (delta.action === 'insert') {
      action = 'si';
    } else if (delta.action === 'remove') {
      action = 'sd';
    } else {
      throw `action ${action} not supported`;
    }
    
    const str = delta.lines.join('\n');
    op[action] = str;
    return op;
  }
  /*
    [{'p':[4],'sd':'e'}]
    [{'p':[4],'si':'d'}]
    * Local -> Remote changes
    * Remote -> locate
    Insert character:
    {'start':{'row':5,'column':1},'end':{'row':5,'column':2},'action':'insert','lines':['d']}
    Insert new line:
    {'start':{'row':7,'column':0},'end':{'row':8,'column':0},'action':'insert','lines':['','']}
    Delete line:

  */
  /*
   * Remote -> Local changes
   */

  opTransform(op) {
    const self = this;
    const index = op.p[op.p.length -1]; 
    const pos = self.session.doc.indexToPosition(pos, 0); 
    let action;
    let lines;
    if('sd' in op) {
      action = 'remove';
      lines = op.sd.split('\n');
    } else if ('si' in op) {
      action = 'insert';
      lines = op.si.split('\n');
    } else {
      throw Exception('Invalid Operation: ' + JSON.stringify(op));
    }
    
    const delta = {
      'start': pos,
      'end':{
        'row': pos.row + lines.length,
        'column': lines[lines.length - 1].length
      },
      'action': action,
      'lines': lines
    };
    return delta;
  }
}

export default sharedbAceBinding;
