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
      console.log(op);
      // false because op needs to be sent to the server
      // self.doc.submitOp(op, false, function(err) {
      //   if (err) throw err;
      // });
    });
    // this.doc.on('op', function(op, source) {
    //   console.log(op);
    // });
  }

  /**
   * @param delta - delta that ace editor produces upon changes
   * eg. {"start":{"row":5,"column":1},"end":{"row":5,"column":2},"action":"insert","lines":["d"]}
   */
  deltaTransform(delta) {
    // TODO: add path 
    var aceDoc = this.session.getDocument();
    var obj = {};
    obj.p = aceDoc.positionToIndex(delta.start);
    var action;
    if (delta.action === "insert") {
      action = "si";
    } else if (delta.action === "remove") {
      action = "sr";
    } else {
      throw new Exception("action not supported");
    }
    
    var str = delta.lines.join("\n");
    obj[action] = str;
    return obj;
  }
  /*
    [{"p":[4],"sd":"e"}]
    [{"p":[4],"si":"d"}]
    * Local -> Remote changes
    * Remote -> locate
    Insert character:
    {"start":{"row":5,"column":1},"end":{"row":5,"column":2},"action":"insert","lines":["d"]}
    Insert new line:
    {"start":{"row":7,"column":0},"end":{"row":8,"column":0},"action":"insert","lines":["",""]}
    Delete line:

  */
  /*
   * Remote -> Local changes
   */

	opTransform(op) {
    var index = aceInstance.session.doc.positionToIndex(op.path[0], 0);
    var row = index.row;
    var col = index.column;

    if("sd" in op) {
      // delete
      lines = op.sd.split("\n");
      delta = {"start":index,
               "end":{"row":row + lines.length, "column":lines[lines.length - 1].length},
               "action":"remove", "lines":lines};
    } else if("si" in op) {
      // insert
      // get row and column
      var lines = op.si.split("\n");
      delta = {"start":index,
               "end":{"row":row + lines.length, "column":lines[lines.length - 1].length},
               "action":"insert", "lines":lines};

    }
	}

}

export default sharedbAce;
