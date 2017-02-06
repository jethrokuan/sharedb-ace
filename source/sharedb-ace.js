var sharedb = require("../node_modules/sharedb/lib/client");
import sharedbAceBinding from "./sharedb-ace-binding";

class sharedbAce {

  /**
   * @param wsUrl - URL to connect to shareDB
   * @param namespace - database table
   * @param id - document id
   * 
   * creating a sharedbAce instance connects to sharedb via the websocket URL
   * and initiates the document
   * and initializes the sharedb with no connections
   */
  constructor(wsUrl, namespace, id) {
    const socket = new WebSocket(wsUrl);
    const connection = new sharedb.Connection(socket);
    const doc = connection.get(namespace, id);
    // Fetches once from the server, and fires events on subsequent document changes
    doc.subscribe(function(err) {
      if (err) throw err;
      if (doc.type === null) {
        throw 'Document Uninitialized';
      }
      console.log(doc);
    }); 
    this.doc = doc;
    
    this.connections = {};
  }
  
  /**
   * @param aceInstance - Ace Editor Instance
   * @param doc - ShareDB.Doc instance
   * adds a two-way binding between an aceInstance and the path
   * eg. add(aceInstance, ["foo"]);
   */ 
  add(aceInstance, path) {
    var binding = new sharedbAceBinding(aceInstance, path, this.doc);
    this.connections[path.join(',')] = binding; 
    binding.setup();
  }
}

export default sharedbAce;
