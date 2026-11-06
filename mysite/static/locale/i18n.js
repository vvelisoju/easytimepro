if (typeof(catalog) === "undefined") {
  catalog = {}
}

function pluralidx(count) {
  return (count === 1) ? 0 : 1;
}

function gettext(msgid) {
  var value = catalog[msgid];
  if (typeof(value) === 'undefined') {
    return msgid;
  } else {
    return (typeof(value) === 'string') ? value : value[0];
  }
}

function ngettext(singular, plural, count) {
  value = catalog[singular];
  if (typeof(value) === 'undefined') {
    return (count === 1) ? singular : plural;
  } else {
    return value[pluralidx(count)];
  }
}

function gettext_noop(msgid) {
  return msgid;
}

