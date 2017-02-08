// require('amd-loader');
// var chai = require('chai');
// var expect = chai.expect;
// var ShareDB = require('sharedb');
// var assert = require('assert');
// var SharedbAce = require('../distribution/sharedb-ace').default;

// // ShareDB setup
// var backend = new ShareDB();
// var connection = backend.connect();

// function newDoc(collection, id, text, cb) {
//   var doc = connection.get(collection, id); 

//   doc.fetch(function(err) {
//     if (err) throw err;
//     if (doc.type === null) {
//       doc.create(text);
//       cb(doc);
//     }
//   });
// }

// // Ace setup
// require('../ace/lib/ace/test/mockdom');
// var MockRenderer = require("../ace/lib/ace/test/mockrenderer").MockRenderer;
// var Editor = require("../ace/lib/ace/editor").Editor;
// var EditSession = require("../ace/lib/ace/edit_session").EditSession;

// // Helper Functions
// function newSAEditor(doc) {
//   var editor = new Editor(new MockRenderer()); 
//   editor.$blockScrolling = Infinity; 
//   var session = new EditSession('');
//   editor.setSession(session);

//   var sa = new sharedbAce(editor, doc);
//   return sa;
// }

// describe('Editor creation', function() {
//   it('sets starting text', function(done) {
//     newDoc('foo', 'bar', 'hello', function(doc) {
//       var sa = newSAEditor(doc);
//       sa.setup();
//       expect(sa.session.getValue()).to.equal('hello');
//       done();
//     }); 
//   });
// });
