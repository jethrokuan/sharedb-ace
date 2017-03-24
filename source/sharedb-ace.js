import WebSocket from 'reconnecting-websocket';
import EventEmitter from 'event-emitter-es6';
import sharedb from 'sharedb/lib/client';
import SharedbAceBinding from './sharedb-ace-binding';

function IllegalArgumentException(message) {
  this.message = message;
  this.name = 'IllegalArgumentException';
}

class SharedbAce extends EventEmitter {
  /**
   * @param id - document id
   * @param options:
   *   namespace
   *   WsUrl
   *   pluginWsUrl
   *
   * creating a sharedbAce instance connects to sharedb via the websocket URL
   * and initiates the document
   * and initializes the sharedb with no connections
   */
  constructor(id, options) {
    super();
    this.id = id;
    if (options.pluginWsUrl !== null) {
      this.pluginWS = new WebSocket(options.pluginWsUrl);
    }

    if (options.WsUrl === null) {
      throw new IllegalArgumentException('wsUrl not provided.');
    }

    this.WS = new WebSocket(options.WsUrl);

    const connection = new sharedb.Connection(this.WS);
    if (options.namespace === null) {
      throw new IllegalArgumentException('namespace not provided.');
    }
    const namespace = options.namespace;
    const doc = connection.get(namespace, id);
    // Fetches once from the server, and fires events on subsequent document changes

    const docSubscribed = (err) => {
      if (err) throw err;

      if (doc.type === null) {
        throw new Error('Document Uninitialized');
      }

      this.emit('ready');
    };

    doc.subscribe(docSubscribed.bind(doc));

    this.doc = doc;
    this.connections = {};
  }

  /**
   * @param aceInstance - Ace Editor Instance
   * @param doc - ShareDB.Doc instance
   * adds a two-way binding between an aceInstance and the path
   * eg. add(aceInstance, ['foo']);
   */
  add(aceInstance, path, plugins) {
    const sharePath = path || [];
    const binding = new SharedbAceBinding({
      ace: aceInstance,
      doc: this.doc,
      path: sharePath,
      pluginWS: this.pluginWS,
      id: this.id,
      plugins,
    });
    this.connections[JSON.stringify(path)] = binding;
  }
}

export default SharedbAce;
