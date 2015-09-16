'use strict';


/**
 * Angular-Module: pd-permission
 * [Description]
 */
var mod = module.exports = angular.module('pd.permission', []);

// Configs


// Runners
mod.run( require('./run/stateChangeStart') );

// Providers
mod.provider('Permission', require('./providers/permission'));


// Factories


// Services


// Directives


// Filters


