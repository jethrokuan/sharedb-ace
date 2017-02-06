class sharedbAceBinding {
  constructor(aceInstance, path, doc) {    
    this.session = aceInstance.getSession();
    this.path = path;
    this.doc = doc; 
    this.setup();
  }

  setup() {
    const self = this;
    
    // self.session.setValue(self.doc.data[self.path[0]]); 
    
    self.session.on('change', function(delta) {
      const op = self.deltaTransform(delta);
      console.log(op);
      // set source to self
      self.doc.submitOp([op], {source: self}, function(err) {
        if (err) throw err;
      });
    });
    self.doc.on('op', function(op, source) {
      if (source === self) return;
      const delta = self.opTransform(op);
      self.session.getDocument().applyDeltas([delta]);
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
    const pos = op.path[op.path.length -1];
    const index = aceInstance.session.doc.positionToIndex(pos, 0);
    let action;
    if('sd' in op) {
      action = 'remove';
    } else if ('si' in op) {
      action = 'insert';
    } else {
      throw Exception('Invalid Operation: ' + JSON.stringify(op));
    }
    const lines = op[action].split('\n');
    const delta = {
      'start': index,
      'end':{
        'row': index.row + lines.length,
        'column': lines[lines.length - 1].length
      },
      'action': action,
      'lines': lines
    };
    return delta;
  }
}

export default sharedbAceBinding;
