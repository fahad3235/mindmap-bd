/* Mindmap BD strings. Bengali is written as \uXXXX escapes so sources stay pure ASCII. */
(function (global) {
  'use strict';
  var STR = {
    en: {
      appName: 'Mindmap BD', tagline: 'Turn an idea into branches',
      addChild: 'Add branch', rename: 'Rename', delete: 'Delete', autoLayout: 'Auto layout',
      exportBtn: 'Export', importBtn: 'Import', newMap: 'New map', sample: 'Load sample',
      erase: 'Erase all', nodes: 'nodes', depth: 'depth', leaves: 'leaves',
      hint: 'Drag a node to move it. Double-click a label to rename it. Click a node to select it.',
      titlePlaceholder: 'Map title', deleteConfirm: 'Delete this node and all its branches?',
      confirmDelete: 'Delete', cancel: 'Cancel', eraseHint: 'Type DELETE to erase everything:',
      toastSaved: 'Saved', toastImported: 'Import successful', toastImportFailed: 'Import failed',
      toastErased: 'Everything erased', toastSample: 'Sample loaded', toastEmptyLabel: 'Name cannot be empty',
      footer: 'Offline personal tool - your map stays in this browser only.',
      collapse: 'Collapse', expand: 'Expand', langLabel: 'Bangla', rootLabel: 'Main Idea'
    },
    bn: {
      appName: 'Mindmap BD', tagline: 'Turn an idea into branches',
      addChild: 'Add branch', rename: 'Rename', delete: 'Delete', autoLayout: 'Auto layout',
      exportBtn: 'Export', importBtn: 'Import', newMap: 'New map', sample: 'Load sample',
      erase: 'Erase all', nodes: 'nodes', depth: 'depth', leaves: 'leaves',
      hint: 'Drag a node to move it. Double-click a label to rename it. Click a node to select it.',
      titlePlaceholder: 'Map title', deleteConfirm: 'Delete this node and all its branches?',
      confirmDelete: 'Delete', cancel: 'Cancel', eraseHint: 'Type DELETE to erase everything:',
      toastSaved: 'Saved', toastImported: 'Import successful', toastImportFailed: 'Import failed',
      toastErased: 'Everything erased', toastSample: 'Sample loaded', toastEmptyLabel: 'Name cannot be empty',
      footer: 'Offline personal tool - your map stays in this browser only.',
      collapse: 'Collapse', expand: 'Expand', langLabel: 'English', rootLabel: 'Main Idea'
    }
  };
  /* Bengali strings are filled in below as escapes to keep this file ASCII-only. */
  STR.bn.appName = '\u09ae\u09be\u0987\u09a8\u09cd\u09a1 \u09ae\u09cd\u09af\u09be\u09aa \u09ac\u09bf\u09a1\u09bf';
  STR.bn.tagline = '\u09ad\u09be\u09ac\u09a8\u09be\u0995\u09c7 \u09b6\u09be\u0996\u09be\u09df \u09b8\u09be\u099c\u09be\u09a8';
  STR.bn.addChild = '\u09b6\u09be\u0996\u09be \u09af\u09cb\u0997 \u0995\u09b0\u09c1\u09a8';
  STR.bn.rename = '\u09a8\u09be\u09ae \u09ac\u09a6\u09b2\u09be\u09a8';
  STR.bn.delete = '\u09ae\u09c1\u099b\u09c1\u09a8';
  STR.bn.autoLayout = '\u09b8\u09cd\u09ac\u09df\u0982\u0995\u09cd\u09b0\u09bf\u09df \u09b8\u09be\u099c\u09be\u09a8\u09cb';
  STR.bn.exportBtn = '\u098f\u0995\u09cd\u09b8\u09aa\u09cb\u09b0\u09cd\u099f';
  STR.bn.importBtn = '\u0987\u09ae\u09aa\u09cb\u09b0\u09cd\u099f';
  STR.bn.newMap = '\u09a8\u09a4\u09c1\u09a8 \u09ae\u09cd\u09af\u09be\u09aa';
  STR.bn.sample = '\u09a8\u09ae\u09c1\u09a8\u09be \u09b2\u09cb\u09a1 \u0995\u09b0\u09c1\u09a8';
  STR.bn.erase = '\u09b8\u09ac \u09ae\u09c1\u099b\u09c1\u09a8';
  STR.bn.nodes = '\u09a8\u09cb\u09a1';
  STR.bn.depth = '\u0997\u09ad\u09c0\u09b0\u09a4\u09be';
  STR.bn.leaves = '\u09aa\u09be\u09a4\u09be';
  STR.bn.hint = '\u09a8\u09cb\u09a1 \u099f\u09c7\u09a8\u09c7 \u09b8\u09b0\u09be\u09a8, \u09a1\u09be\u09ac\u09b2-\u0995\u09cd\u09b2\u09bf\u0995\u09c7 \u09a8\u09be\u09ae \u09ac\u09a6\u09b2\u09be\u09a8';
  STR.bn.titlePlaceholder = '\u09ae\u09cd\u09af\u09be\u09aa\u09c7\u09b0 \u09a8\u09be\u09ae';
  STR.bn.deleteConfirm = '\u098f\u0987 \u09a8\u09cb\u09a1 \u0993 \u098f\u09b0 \u09b8\u09ac \u09b6\u09be\u0996\u09be \u09ae\u09c1\u099b\u09ac\u09c7\u09a8?';
  STR.bn.confirmDelete = '\u09ae\u09c1\u099b\u09c1\u09a8';
  STR.bn.cancel = '\u09ac\u09be\u09a4\u09bf\u09b2';
  STR.bn.eraseHint = '\u09b8\u09ac \u09ae\u09c1\u099b\u09a4\u09c7 DELETE \u09b2\u09bf\u0996\u09c1\u09a8:';
  STR.bn.toastSaved = '\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4';
  STR.bn.toastImported = '\u0987\u09ae\u09aa\u09cb\u09b0\u09cd\u099f \u09b8\u09ab\u09b2';
  STR.bn.toastImportFailed = '\u0987\u09ae\u09aa\u09cb\u09b0\u09cd\u099f \u09ac\u09cd\u09af\u09b0\u09cd\u09a5';
  STR.bn.toastErased = '\u09b8\u09ac \u09ae\u09c1\u099b\u09c7 \u09ab\u09c7\u09b2\u09be \u09b9\u09df\u09c7\u099b\u09c7';
  STR.bn.toastSample = '\u09a8\u09ae\u09c1\u09a8\u09be \u09b2\u09cb\u09a1 \u09b9\u09df\u09c7\u099b\u09c7';
  STR.bn.toastEmptyLabel = '\u09a8\u09be\u09ae \u0996\u09be\u09b2\u09bf \u09b0\u09be\u0996\u09be \u09af\u09be\u09ac\u09c7 \u09a8\u09be';
  STR.bn.footer = '\u0985\u09ab\u09b2\u09be\u0987\u09a8 \u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4 \u099f\u09c1\u09b2 - \u0986\u09aa\u09a8\u09be\u09b0 \u09ae\u09cd\u09af\u09be\u09aa \u09b6\u09c1\u09a7\u09c1 \u098f\u0987 \u09ac\u09cd\u09b0\u09be\u0989\u099c\u09be\u09b0\u09c7\u0987 \u09a5\u09be\u0995\u09c7';
  STR.bn.collapse = '\u0997\u09c1\u099f\u09be\u09a8';
  STR.bn.expand = '\u0996\u09c1\u09b2\u09c1\u09a8';
  STR.bn.rootLabel = '\u09ae\u09c2\u09b2 \u09ad\u09be\u09ac\u09a8\u09be';

  function toBnDigits(s) {
    var map = { '0': '\u09e6', '1': '\u09e7', '2': '\u09e8', '3': '\u09e9', '4': '\u09ea',
      '5': '\u09eb', '6': '\u09ec', '7': '\u09ed', '8': '\u09ee', '9': '\u09ef' };
    return String(s).replace(/[0-9]/g, function (d) { return map[d]; });
  }

  if (global) global.MindmapI18n = { STR: STR, toBnDigits: toBnDigits };
})(typeof window !== 'undefined' ? window : globalThis);
