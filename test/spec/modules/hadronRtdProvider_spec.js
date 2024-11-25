// TODO: this and hadronRtdProvider_spec are a copy-paste of each other

import {config} from 'src/config.js';
import {HALOID_LOCAL_NAME, RTD_LOCAL_NAME, addRealTimeData, getRealTimeData, hadronSubmodule, storage} from 'modules/hadronRtdProvider.js';
import {server} from 'test/mocks/xhr.js';

const responseHeader = {'Content-Type': 'application/json'};

describe('hadronRtdProvider', function() {
  let getDataFromLocalStorageStub;

  beforeEach(function() {
    config.resetConfig();
    getDataFromLocalStorageStub = sinon.stub(storage, 'getDataFromLocalStorage');
  });

  afterEach(function () {
    getDataFromLocalStorageStub.restore();
  });

  describe('hadronSubmodule', function() {
    it('successfully instantiates', function () {
		  expect(hadronSubmodule.init()).to.equal(true);
    });
  });
});
