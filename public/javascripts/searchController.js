function SearchController(queryService) {
	this.userQuery = '';
	this.results = [];
	this.totalPages = 0;
	this.page = 0;
	this.perPage = 10;
	this.queryService = queryService;
}

SearchController.prototype.search = function (page) {
	var _this = this;
	this.page = page;
	if (this.userQuery.length == 0) {
		_this.numFound = null;
		_this.totalPages = null;
		_this.results = null;
		_this.pagArray = null;
		_this.suggestions = null;
		return;
	}

	this.queryService.query(this.userQuery, this.page, this.perPage).success(
		function (serverResponse) {
			_this.numFound = serverResponse.response.numFound;
			_this.totalPages = (_this.numFound / 10);
			if (_this.numFound > 0) {
				handleResults(serverResponse);
			}
			_this.suggestions = handleSuggestions.call(_this, serverResponse)
			_this.results = serverResponse.response.docs;
			_this.pagArray = createPagination(_this.page, _this.totalPages);

		});
};

function handleSuggestions(serverResponse) {
	if (serverResponse.spellcheck && serverResponse.spellcheck.suggestions && serverResponse.spellcheck.suggestions.length > 0) {
		var suggestions = serverResponse.spellcheck.suggestions;
		var parsedSuggestions = [];
		for (var i = 0; i < suggestions.length; i = i + 2) {
			var key = suggestions[i];
			var sug = suggestions[i + 1];
			var obj = {
				key: key,
				sug: sug.suggestion
			}
			parsedSuggestions.push(obj)
		}
		return parsedSuggestions;
	}
}

function handleResults(serverResponse) {
	serverResponse.response.docs.forEach(function (response) {

		var title = response['html-title'];
		var htmlUri = response['warc-target-uri'];
		if (title) {
			response.htmlTitle = (response['html-title'] || '');
			response.htmlTitle = response.htmlTitle[0].trim();
		} else {
			response.htmlTitle = 'No title available';
		}
		if (htmlUri) {
			response.htmlUri = (response['warc-target-uri'] || '#');
			response.htmlUri = response.htmlUri[0].trim();
		} else {
			response.htmlUri = '#';
		}

		if (response['html-content'] && response['html-content'][0]) {
			response.htmlContent = response['html-content'][0];
		} else {
			response.htmlContent = 'No preview available';
		}
	});
}

function createPagination(page, totalPages) {
	var start, stop;
	if (page - 5 < 0) {
		start = 0;
	} else {
		start = page - 5;
	}

	if (page + 5 > totalPages) {
		stop = totalPages;
	} else {
		stop = page + 5;
	}
	var pag = [];
	for (var i = start; i < stop && pag.length <= 10; i++) {
		pag.push(i);
	}
	return pag;
}

SearchController.prototype.changeModel = function (value) {
	this.userQuery = value;
	this.search(0);
};

app.controller('SearchController', ['queryService', SearchController]);