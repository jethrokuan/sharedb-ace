require('amd-loader');
var chai = require('chai');
var chaiJsonEqual = require('chai-json-equal');
chai.use(chaiJsonEqual);
var expect = chai.expect;
var assert = require('assert');

import SharedbAceBinding from '../source/sharedb-ace-binding';

require('../ace/lib/ace/test/mockdom');
var MockRenderer = require("../ace/lib/ace/test/mockrenderer").MockRenderer;
var Editor = require("../ace/lib/ace/editor").Editor;
var EditSession = require("../ace/lib/ace/edit_session").EditSession;

var editor = new Editor(new MockRenderer()); 
editor.$blockScrolling = Infinity;
var session = new EditSession('');
editor.setSession(session);

// doc = connection.get("test", "testId");

var binding = new SharedbAceBinding(editor, ["foo"], {});

var TC = [
  [{"p":["code",0],"si":"f"}],
  [{"p":["code",1],"si":"o"}],
  [{"p":["code",2],"si":"o"}],
  [{"p":["code",3],"si":"b"}],
  [{"p":["code",4],"si":"a"}],
  [{"p":["code",5],"si":"r"}],
  [{"p":["code",6],"si":"b"}],
  [{"p":["code",7],"si":"a"}],
  [{"p":["code",8],"si":"z"}]
]
describe("Delta to Op", function() {
  it('transforms delta to ops correctly', function(done) {
    TC.forEach(function(testCase) {
      var transformed = binding.deltaTransform(binding.opTransform(testCase));
      testCase.should.jsonEqual(transformed);
    });
  });
});
