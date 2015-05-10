app = angular.module('x',[])
	.config(['$interpolateProvider', function($interpolateProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	}])