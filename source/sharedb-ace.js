class sharedbAce {
  /**
   * @param aceInstance - Ace Editor Instance
   * @param doc - ShareDB.Doc instance
   */
  constructor(aceInstance, doc) {
    // Fetch Ace Editor Instance
    this.session = aceInstance.getSession();
    // If document is not initialized throw an error
    // if (doc.type === null)
    //   throw new Error("Document Uninitialized");
    // else this.doc = doc;
    this.setup();
  }

  setup() {
    // this.session.setValue(this.doc.data);
    var self = this;
    this.session.on("change", function(delta) {
      var op = self.deltaTransform(delta);
      // false because op needs to be sent to the server
      self.doc.submitOp(op, false, function(err) {
        if (err) throw err;
      }); 
    });
    // this.doc.on('op', function(op, source) {
    //   console.log(op);
    // });
  }

  /*
   * Remote->Local changes
   */

  deltaTransform(delta) {
    // TODO: add path
    // TODO: refactor
    var aceDoc = this.session.getDocument();
    var obj = {};
    obj.p = aceDoc.positionToIndex(delta.start);
    if (delta.action === "insert") {
      if (delta.lines.length === 2) {
        obj.si = "\n";
      } else {
        obj.si = delta.lines[0];
      } 
    } else if (delta.action === "remove") {
      if (delta.lines.length === 2) {
        obj.sr = "\n"; 
      } else {
        obj.sr = delta.lines[0];
      } 
    } else {
      throw new Exception("action not supported");
    }
    return obj;
  }
  
  /*
   * Local -> Remote changes
   */
}

export default sharedbAce;
