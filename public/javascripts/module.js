app = angular.module('x', [])
	.config(['$interpolateProvider', '$sceProvider', function ($interpolateProvider, $sceProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
		$sceProvider.enabled(false);

	}])