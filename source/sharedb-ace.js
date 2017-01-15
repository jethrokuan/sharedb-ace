class sharedbAce {
  /**
   * @param aceInstance - Ace Editor Instance
   * @param doc - ShareDB.Doc instance
   */
  constructor(aceInstance, doc) {
    // Fetch Ace Editor Instance
    this.session = aceInstance.getSession();
    // If document is not initialized throw an error
    if (doc.type === null)
      throw new Error("Document Uninitialized");
    else this.doc = doc; 
  }

  setup() {
    this.session.setValue(this.doc.data);
    this.doc.on('op', function(op, source) {
      console.log(op);
    });    
  }
}

export default sharedbAce;
