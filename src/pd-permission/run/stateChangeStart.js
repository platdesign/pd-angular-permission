'use strict';

function arrify(input) {
	return angular.isArray(input) ? input : [input];
}

function mergeRoles(old, add) {
	arrify(add).forEach(function(item) {
		if(old.indexOf(item) === -1) {
			old.push(item);
		}
	});
}

module.exports = ['$rootScope', 'Permission', '$state', '$q', function ($rootScope, Permission, $state, $q) {

	$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
		if (toState.$$finishAuthorize) {
			return;
		}

		// Look for permissions
		var permissions;
		if (toState.data && toState.data.permissions) {
			permissions = toState.data.permissions;
		}


		if(permissions) {

			if(permissions.inherit !== false) {

				permissions = toState.name
					// make array of state way segments
					.split('.')

					// map segments to full state names
					.map(function(val, index, orig) {
						return orig.slice(0, index+1).join('.');
					})

					// get state objects
					.map(function(stateName) {
						return $state.get(stateName);
					})

					// filter states by having permissions and having permissions
					// which are not the same as the parent state has
					.filter(function(state, index, orig) {

						// if has parent state
						if(index > 0) {
							var parentState = orig[index-1];

							// if parent state permissions are the same
							if(parentState.data && parentState.data.permissions && state.data.permissions === parentState.data.permissions) {
								return false;
							}
						}

						return state.data && state.data.permissions;
					})

					// map to permission objects
					.map(function(state) {
						return state.data.permissions;
					});
			} else {
				permissions = arrify(permissions);
			}
		}

		// If permissions defined - prevent default and start permission state change
		if (permissions) {
			event.preventDefault();
			toState = angular.extend({'$$finishAuthorize': true}, toState);


			if ($rootScope.$broadcast('$stateChangePermissionStart', toState, toParams).defaultPrevented) {
				return;
			}


			Permission.authorizeMultiple(permissions, toParams)
				.then(function () {
					// Borrowed from angular-permission - https://github.com/Narzerus/angular-permission
					// If authorized, use call state.go without triggering the event.
					// Then trigger $stateChangeSuccess manually to resume the rest of the process
					// Note: This is a pseudo-hacky fix which should be fixed in future ui-router versions
					if (!$rootScope.$broadcast('$stateChangeStart', toState, toParams, fromState, fromParams).defaultPrevented) {
						$rootScope.$broadcast('$stateChangePermissionAccepted', toState, toParams);

						$state.go(toState.name, toParams, {notify: false})
						.then(function() {
							$rootScope.$broadcast('$stateChangeSuccess', toState, toParams, fromState, fromParams);
						});
					}
				})
				.catch(function(permission) {

					if (!$rootScope.$broadcast('$stateChangeStart', toState, toParams, fromState, fromParams).defaultPrevented) {
						$rootScope.$broadcast('$stateChangePermissionDenied', toState, toParams);

						if(permission.redirectTo) {

							// if redirectTo is a function
							if( angular.isFunction(permission.redirectTo) ) {
								$q.when( permission.redirectTo() )
								.then(function(newState) {
									// If the function returns a state then go to it
									if(newState) {
										$state.go(newState, toParams);
									}
								})

							// if redirectTo is a string expect it is a state name and go to it
							} else if( angular.isString(permission.redirectTo) ) {
								$state.go(permission.redirectTo, toParams);
							}

						}
					}

				});

		}
	});
}];




