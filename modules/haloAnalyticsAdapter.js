import { ajax } from '../src/ajax.js';
import adapter from '../src/AnalyticsAdapter.js';
import adapterManager from '../src/adapterManager.js';
import * as utils from '../src/utils.js';
import CONSTANTS from '../src/constants.json';
import { getStorageManager } from '../src/storageManager.js';

/**
 * haloAnalyticsAdapter.js - Audigent Halo Analytics Adapter
 */

const HALO_ANALYTICS_URL = 'https://analytics.halo.ad.gt/api/v1/analytics'
export const HALOID_LOCAL_NAME = 'auHaloId';
const HALOID_ANALYTICS_VER = 'pbadgt0';
const DEFAULT_PUBLISHER_ID = 0;

export const storage = getStorageManager();

var viewId = utils.generateUUID();

var publisherId = DEFAULT_PUBLISHER_ID;

var w = window;
var d = document;
var e = d.documentElement;
var g = d.getElementsByTagName('body')[0];
var x = w.innerWidth || e.clientWidth || g.clientWidth;
var y = w.innerHeight || e.clientHeight || g.clientHeight;

export function getHaloId(callback) {
  let haloId = storage.getDataFromLocalStorage(HALOID_LOCAL_NAME);
  if (haloId) {
    callback(haloId);
  } else {
    var script = document.createElement('script')
    script.type = 'text/javascript';

    script.onload = function() {
      haloId = storage.getDataFromLocalStorage(HALOID_LOCAL_NAME);
      callback(haloId);
    }

    script.src = 'https://id.halo.ad.gt/api/v1/haloid';
    document.getElementsByTagName('head')[0].appendChild(script);
  }
}

var pageView = {
  eventType: 'pageView',
  userAgent: window.navigator.userAgent,
  timestamp: Date.now(),
  timezoneOffset: new Date().getTimezoneOffset(),
  language: window.navigator.language,
  vendor: window.navigator.vendor,
  pageUrl: window.top.location.href,
  screenWidth: x,
  screenHeight: y
};

var eventQueue = [
  pageView
];

var startAuction = 0;
var bidRequestTimeout = 0;
let analyticsType = 'endpoint';

let haloAnalyticsAdapter = Object.assign(adapter({url: HALO_ANALYTICS_URL, analyticsType}), {
  track({eventType, args}) {
    args = args ? JSON.parse(JSON.stringify(args)) : {};
    var data = {};

    switch (eventType) {
      case CONSTANTS.EVENTS.AUCTION_INIT: {
        data = args;
        startAuction = data.timestamp;
        bidRequestTimeout = data.timeout;
        break;
      }

      case CONSTANTS.EVENTS.AUCTION_END: {
        data = args;
        data.start = startAuction;
        data.end = Date.now();
        break;
      }

      case CONSTANTS.EVENTS.BID_ADJUSTMENT: {
        data.bidders = args;
        break;
      }

      case CONSTANTS.EVENTS.BID_TIMEOUT: {
        data.bidders = args;
        data.duration = bidRequestTimeout;
        break;
      }

      case CONSTANTS.EVENTS.BID_REQUESTED: {
        data = args;
        break;
      }

      case CONSTANTS.EVENTS.BID_RESPONSE: {
        data = args;
        delete data.ad;
        break;
      }

      case CONSTANTS.EVENTS.BID_WON: {
        data = args;
        delete data.ad;
        delete data.adUrl;
        break;
      }

      case CONSTANTS.EVENTS.BIDDER_DONE: {
        data = args;
        break;
      }

      case CONSTANTS.EVENTS.SET_TARGETING: {
        data.targetings = args;
        break;
      }

      case CONSTANTS.EVENTS.REQUEST_BIDS: {
        data = args;
        break;
      }

      case CONSTANTS.EVENTS.ADD_AD_UNITS: {
        data = args;
        break;
      }

      case CONSTANTS.EVENTS.AD_RENDER_FAILED: {
        data = args;
        break;
      }

      default:
        return;
    }

    data.eventType = eventType;
    data.timestamp = data.timestamp || Date.now();

    sendEvent(data);
  }
});

haloAnalyticsAdapter.originEnableAnalytics = haloAnalyticsAdapter.enableAnalytics;

haloAnalyticsAdapter.enableAnalytics = function(conf = {}) {
  if (typeof conf.options === 'object') {
    if (conf.options.publisherId) {
      publisherId = conf.options.publisherId;
    } else {
      publisherId = DEFAULT_PUBLISHER_ID;
    }
  } else {
    utils.logError('HALO_ANALYTICS_NO_CONFIG_ERROR');
    return;
  }

  haloAnalyticsAdapter.originEnableAnalytics(conf);
}

function flush() {
  if (eventQueue.length > 1) {
    var data = {
      pageViewId: viewId,
      ver: HALOID_ANALYTICS_VER,
      publisherId: publisherId,
      events: eventQueue
    };

    ajax(HALO_ANALYTICS_URL,
      () => utils.logInfo('HALO_ANALYTICS_BATCH_SEND'),
      JSON.stringify(data),
      {
        contentType: 'application/json',
        method: 'POST'
      }
    );

    eventQueue = [
      pageView
    ];
  }
}

function sendEvent(event) {
  eventQueue.push(event);
  utils.logInfo(`HALO_ANALYTICS_EVENT ${event.eventType} `, event);

  if (event.eventType === CONSTANTS.EVENTS.AUCTION_END) {
    flush();
  }
}

adapterManager.registerAnalyticsAdapter({
  adapter: haloAnalyticsAdapter,
  code: 'halo'
});

haloAnalyticsAdapter.flush = flush;

export default haloAnalyticsAdapter;
