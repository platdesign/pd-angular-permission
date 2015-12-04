#pd-angular-permission

Angular ui-router permissions



#Usage

## Define role

```javascript
app.run(['Permission', 'User', function(Permission, User){

	Permission.defineRole('authenticated', function(){
		return User.isAuthenticated(); // returns promise
	});

}]);
```


## Define permissions on state


- **every** - Array of role names

	Every given role needs to resolve to give access.

- **any** - Array of role names

	At least one of the given roles needs to resolve to give access.

- **none** - Array of role names

	None of the given must resolve to give access.

- **redirectTo** - String Statename

	State to redirect to if access is denied.

```javascript
{
	data: {
		permissions:{
			every: ['authenticated', 'chargedAccount'],
			redirectTo: 'app.signin'
		}
	}
}
```


#Author

Christian Blaschke <mail@platdesign.de>
