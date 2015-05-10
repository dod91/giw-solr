app.service('queryService', ['$http', function ($http) {
  var query = function (term, page, perPage) {
    term = term.trim();
    // term = term.split(' ').join('+');

    var query = 'text:*' + term + '*';

    return $http({
      method: 'JSONP',
      url: 'http://localhost:8983/solr/new_core/select',
      params: {
        'json.wrf': 'JSON_CALLBACK',
        'q': query,
        'wt': 'json',
        'spellcheck.accuracy': 0.6,
        'rows': perPage,
        'start': page * perPage,
        '_': Date.now()
      }
    });
  }

  return {
    query: query
  }
}])