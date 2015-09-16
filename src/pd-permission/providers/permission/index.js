'use strict';

/**
 * Provider: Permission
 */
module.exports = [function() {

	var roles = {};





	this.$get = ['$q', function ($q) {

		var service = {};

		service.defineRole = function(name, validator) {
			// register role
			roles[name] = validator;

			// register negated role
			roles['!'+name] = function(toParams, name) {
				return validator.apply(null, argument)
				// Invert result of promise
				.then($q.reject, $q.resolve)
			}
		};


		service.authorize = function (roleMap, toParams, resolveCache) {

			var promise = $q.resolve();

			var resolveRole = function(roleName) {

				if(resolveCache && resolveCache[roleName]) {
					return resolveCache[roleName];
				}

				if(!roles[roleName]) {
					throw new Error('Role ('+roleName+') not defined!');
				}
				log.verbose('Authorizing role: '+roleName);

				var promise = $q.when(roles[roleName](toParams, roleName));

				if(resolveCache) {
					resolveCache[roleName] = promise;
				}

				return promise;
			};

			var in2array = function(input) {
				return angular.isArray(input) ? input : [input];
			};

			// Every role must resolve
			if(roleMap.every) {
				roleMap.every = in2array(roleMap.every);

				promise = promise.then(function() {
					var p = $q.resolve();

					roleMap.every.forEach(function(roleName) {
						p = p.then(function() {
							return resolveRole(roleName);
						});
					});

					return p;

				});
			}

			// One role must resolve
			if(roleMap.any) {
				roleMap.any = in2array(roleMap.any);

				promise = promise.then(function() {
					var p = $q.reject();

					roleMap.any.forEach(function(roleName) {
						p = p.then(function() {
							return $q.resolve();
						}, function() {
							return resolveRole(roleName);
						});
					});

					return p;
				});
			}

			// No role must resolve
			if(roleMap.none) {
				roleMap.none = in2array(roleMap.none);

				promise = promise.then(function() {
					var p = $q.reject();

					roleMap.none.forEach(function(roleName) {

						p = p.then(function() {
							return $q.resolve();
						}, function() {
							return resolveRole(roleName);
						});

					});

					return p.then($q.reject, $q.resolve);
				});
			}

			return promise;
		};



		service.authorizeMultiple = function(roleMaps, toParams) {
			var self = this;

			var resolveCache = {};

			var promise = $q.resolve();

			// authorize each state
			roleMaps.forEach(function(roleMap) {
				promise = promise.then(function() {
					return self.authorize(roleMap, toParams, resolveCache)
						.then(function() {
							return $q.resolve();
						}, function() {
							return $q.reject(roleMap);
						})
					});
			});

			return promise;
		};


		return service;

	}];

}];
