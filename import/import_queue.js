var WARCStream = require('warc'),
	sanitizeHtml = require('sanitize-html'),
	async = require('async'),
	http = require('http'),
	fs = require('fs'),
	w = new WARCStream();

var queueLimit = 100;
http.globalAgent.maxSockets = queueLimit;


var options = {
	host: 'localhost',
	path: '/solr/new_core/update/json/docs?wt=json&commit=true',
	port: '8983',
	'Content-type': 'application/json',
	method: 'POST'
};

var str = ''
var callbackRequest = function (callback) {
	return function (response) {

		response.on('error', function (err) {
			str = '';
			console.log('======');
			console.log(err);
		})
		response.on('data', function (chunk) {
			str += chunk;
		});

		response.on('end', function () {
			console.log('end');
			callback();
		});
	}
}


var q = async.queue(function (task, callback) {
	task = JSON.stringify(task);
	options['Content-Length'] = task.length;
	var req = http.request(options, callbackRequest(callback));
	req.end(task);

}, queueLimit);

var x = [];
fs.createReadStream('./CC-MAIN-20140820021320-00000-ip-10-180-136-8.ec2.internal.warc')
	.pipe(w)
	.on('error', function (err) {
		console.log('er', err);
	})
	.on('data', function (data) {



		var content = data.content.toString();
		var keywords = _parseKeywords(content);
		var htmlTitle = _parseTitle(content);
		var htmlContent = _parseHtml(content);


		var finalData = {
			'id': Date.now(),
			'warc-type': data.headers['WARC-Type'],
			'warc-date': data.headers['WARC-date'],
			'warc-record-id': data.headers['WARC-Record-ID'],
			'content-length': data.headers['Content-Length'],
			'content-type': data.headers['Content-Length'],
			'warc-warcinfo-id': data.headers['WARC-Warcinfo-ID'],
			'warc-concurrent-to': data.headers['WARC-Concurrent-To'],
			'warc-ip-address': data.headers['WARC-IP-Address'],
			'warc-target-uri': data.headers['WARC-Target-URI'],
			'html-title': htmlTitle,
			'html-content': htmlContent
		}

		if (keywords && keywords.length > 0) {
			finalData.keywords = keywords;
		}
		q.push(finalData);
		/*
		{ protocol: 'WARC/1.0',
		  headers:
		   { 'WARC-Type': 'response',
		     'WARC-Date': '2014-08-21T04:21:14Z',
		     'WARC-Record-ID': '<urn:uuid:edad822f-2290-4827-a5ab-a52a60348461>',
		     'Content-Length': '174',
		     'Content-Type': 'application/http; msgtype=response',
		     'WARC-Warcinfo-ID': '<urn:uuid:cf083d66-9910-45e2-b5be-a421f9889aac>',
		     'WARC-Concurrent-To': '<urn:uuid:9994d4fd-40b0-4d41-b1e7-1dc2a7ccb1e7>',
		     'WARC-IP-Address': '65.52.108.2',
		     'WARC-Target-URI': 'http://0.r.msn.com/?ld=7v7Pf0o6dfvcggjmXvvsEKhzVUCUxwxRmKzEhcbUqMsh2Ubu9FZw1vPvSOUQKjNaf9lLFIpVKW3sQMR6aOgbPhwm9WR843zZRpT1jbKN7YgaGETlBJG5fdKcfifIi9WSQu9hAx6A&u=www.sportsmanias.com%2Frumors',
		     'WARC-Payload-Digest': 'sha1:3I42H3S6NNFQ2MSVX7XZKYAYSCX5QBYJ',
		     'WARC-Block-Digest': 'sha1:UHJK3TXZIQRATBF4CIGW33NQ4QAGTE4M' },
		  content: <Buffer 48 54 54 50 2f 31 2e 31 20 32 30 30 20 4f 4b 0d 0a 53 65 72 76 65 72 3a 20 4d 69 63 72 6f 73 6f 66 74 2d 49 49 53 2f 38 2e 30 0d 0a 70 33 70 3a 20 43 50 ...> }
		  */
	}).on('end', onEnd);

function onEnd() {
	console.log('end totale');
}

function _parseTitle(content) {
	var startTitleIndex = content.indexOf('<title>');
	if (startTitleIndex != -1) {
		var endTitleIndex = content.indexOf('</title>');
		var title = content.substring(startTitleIndex + 7, endTitleIndex);
	}
	return title;
}

function _parseHtml(content) {
	var startHtmlTagIndex = content.indexOf('<body>');
	var html;
	if (startHtmlTagIndex != -1) {
		var endHtmlTagIndex = content.indexOf('</body>');
		if (endHtmlTagIndex != -1) {
			html = content.substring(startHtmlTagIndex, endHtmlTagIndex);
		} else {
			html = content.substring(startHtmlTagIndex, 30000);
		}
	} else {
		var startHeadTag = content.indexOf('<head>');
		if (startHeadTag != -1) {
			html = content.substring(startHeadTag, 30000);
		} else {
			html = content.substring(3000, 30000)
		}
	}
	var sanitized = sanitizeHtml(html, {
		allowedTags: [],
		allowedAttributes: {}
	})
	return sanitized;
}

function _parseKeywords(content) {
	var length = 'name="keywords" content="'.length;
	var startKeywords = content.indexOf('name="keywords" content="');
	if (startKeywords != -1) {
		var endKeywordsIndex = content.indexOf('>', startKeywords);
		var keywords = content.substring(startKeywords + length, endKeywordsIndex - 1);
	} else {}
	return keywords;
}