﻿/* areas-lists.module.js */

/**
* @desc this module manages the entity record lists in the admin screen
*/

(function () {
    'use strict';

    angular
        .module('webvellaAdmin') //only gets the module, already initialized in the base.module of the plugin. The lack of dependency [] makes the difference.
        .config(config)
        .controller('WebVellaAdminUsersController', controller)
        .controller('ManageUserModalController', manageUserController);
   
    ///////////////////////////////////////////////////////
    /// Configuration
    ///////////////////////////////////////////////////////

    config.$inject = ['$stateProvider'];

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('webvella-admin-users', {
            parent: 'webvella-admin-base',
            url: '/users', 
            views: {
                "topnavView": {
                    controller: 'WebVellaAdminTopnavController',
                    templateUrl: '/plugins/webvella-admin/topnav.view.html',
                    controllerAs: 'topnavData'
                },
                "sidebarView": {
                    controller: 'WebVellaAdminSidebarController',
                    templateUrl: '/plugins/webvella-admin/sidebar.view.html',
                    controllerAs: 'sidebarData'
                },
                "contentView": {
                	controller: 'WebVellaAdminUsersController',
                	templateUrl: '/plugins/webvella-admin/users.view.html',
                    controllerAs: 'ngCtrl'
                }
            },
            resolve: {
            	checkedAccessPermission: checkAccessPermission,
            	resolvedUserRecordsList: resolveUserRecordsList,
                resolvedRolesList: resolveRolesList
            },
            data: {

            }
        });
    };


    //#region << Resolve Functions >>/////////////////////////
    checkAccessPermission.$inject = ['$q', '$log', 'resolvedCurrentUser', 'ngToast'];
	/* @ngInject */
    function checkAccessPermission($q, $log, resolvedCurrentUser, ngToast) {
    	$log.debug('webvellaAreas>entities> BEGIN check access permission ' + moment().format('HH:mm:ss SSSS'));
    	var defer = $q.defer();
    	var messageContent = '<span class="go-red">No access:</span> You do not have access to the <span class="go-red">Admin</span> area';
    	var accessPermission = false;
    	for (var i = 0; i < resolvedCurrentUser.roles.length; i++) {
    		if (resolvedCurrentUser.roles[i] == "bdc56420-caf0-4030-8a0e-d264938e0cda") {
    			accessPermission = true;
    		}
    	}

    	if (accessPermission) {
    		defer.resolve();
    	}
    	else {

    		ngToast.create({
    			className: 'error',
    			content: messageContent,
    			timeout: 7000
    		});
    		defer.reject("No access");
    	}

    	$log.debug('webvellaAreas>entities> BEGIN check access permission ' + moment().format('HH:mm:ss SSSS'));
    	return defer.promise;
    }


    resolveUserRecordsList.$inject = ['$q', '$log', 'webvellaAdminService', '$stateParams', '$state', '$timeout'];
    /* @ngInject */
    function resolveUserRecordsList($q, $log, webvellaAdminService, $stateParams, $state, $timeout) {
    	$log.debug('webvellaAdmin>areas-list>resolveAreaRecordsList BEGIN state.resolved ' + moment().format('HH:mm:ss SSSS'));
        // Initialize
        var defer = $q.defer();
        
        // Process
        function successCallback(response) {
            if (response.object == null) {
                $timeout(function () {
                    alert("error in response!")
                }, 0);
            }
            else {
                defer.resolve(response.object);
            }
        }

        function errorCallback(response) {
            if (response.object == null) {
                $timeout(function () {
                    alert("error in response!")
                }, 0);
            }
            else {
            	defer.reject(response.message);
            }
        }

        webvellaAdminService.getRecords("","$user_role.id,$user_role.name,id,email,first_name,last_name,enabled,verified,image","user",successCallback, errorCallback);


        // Return
        $log.debug('webvellaAdmin>areas-list>resolveAreaRecordsList END state.resolved ' + moment().format('HH:mm:ss SSSS'));
        return defer.promise;
    }

    // Resolve Roles list /////////////////////////
    resolveRolesList.$inject = ['$q', '$log', 'webvellaAdminService'];
    /* @ngInject */
    function resolveRolesList($q, $log, webvellaAdminService) {
    	$log.debug('webvellaAdmin>entities> BEGIN state.resolved ' + moment().format('HH:mm:ss SSSS'));
        // Initialize
        var defer = $q.defer();

        // Process
        function successCallback(response) {
            defer.resolve(response.object);
        }

        function errorCallback(response) {
        	defer.reject(response.message);
        }

        webvellaAdminService.getRecordsByEntityName("null", "role", "null", successCallback, errorCallback);

        // Return
        $log.debug('webvellaAdmin>entities> END state.resolved ' + moment().format('HH:mm:ss SSSS'));
        return defer.promise;
    }

    //#endregion

    //#region << Controller >> ///////////////////////////////
    controller.$inject = ['$scope', '$log', '$rootScope', '$state', 'pageTitle', 'resolvedUserRecordsList',
							'resolvedRolesList', '$uibModal', 'webvellaAdminService','$timeout'];
    /* @ngInject */
    function controller($scope, $log, $rootScope, $state, pageTitle, resolvedUserRecordsList,
						resolvedRolesList, $uibModal, webvellaAdminService,$timeout) {
    	$log.debug('webvellaAdmin>user-list> START controller.exec ' + moment().format('HH:mm:ss SSSS'));
        /* jshint validthis:true */
        var ngCtrl = this;
        ngCtrl.search = {};

        //#region << Update page title >>
        ngCtrl.pageTitle = "User List | " + pageTitle;
		$timeout(function(){
		 $rootScope.$emit("application-pageTitle-update", ngCtrl.pageTitle);
		},0);
    	//#endregion

        ngCtrl.users = fastCopy(resolvedUserRecordsList.data);
        ngCtrl.users = ngCtrl.users.sort(function (a, b) { return parseFloat(a.email) - parseFloat(b.email) });

        ngCtrl.roles = fastCopy(resolvedRolesList.data);
        ngCtrl.roles = ngCtrl.roles.sort(function (a, b) {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });


        //Create new entity modal
        ngCtrl.openManageUserModal = function (user) {
            if (user != null) {
            	ngCtrl.currentUser = user;
            }
            else {
            	ngCtrl.currentUser = webvellaAdminService.initUser();
            }
            var modalInstance = $uibModal.open({
                animation: false,
                templateUrl: 'manageUserModal.html',
                controller: 'ManageUserModalController',
                controllerAs: "popupCtrl",
                size: "lg",
                resolve: {
                    ngCtrl: function () {
                        return ngCtrl;
                    }
                }
            });

        }


        $log.debug('webvellaAdmin>areas-list> END controller.exec ' + moment().format('HH:mm:ss SSSS'));
    }
    //#endregion


    //// Modal Controllers
    manageUserController.$inject = ['$uibModalInstance', '$log', '$sce', '$uibModal', '$filter', 'webvellaAdminService', 'webvellaRootService', 'ngToast', '$timeout', '$state', '$location', 'ngCtrl'];
    /* @ngInject */
    function manageUserController($uibModalInstance, $log, $sce, $uibModal, $filter, webvellaAdminService, webvellaRootService, ngToast, $timeout, $state, $location, ngCtrl) {
    	$log.debug('webvellaAdmin>entities>createEntityModal> START controller.exec ' + moment().format('HH:mm:ss SSSS'));
        /* jshint validthis:true */
        var popupCtrl = this;
        popupCtrl.modalInstance = $uibModalInstance;
        popupCtrl.user = fastCopy(ngCtrl.currentUser);
        popupCtrl.roles = fastCopy(ngCtrl.roles);
        popupCtrl.password = null;
    	//Init user roles
        popupCtrl.userRoles = [];

        popupCtrl.isUpdate = true;
        if (popupCtrl.user.id == null) {
        	popupCtrl.isUpdate = false;
        	//popupCtrl.user.$user_role = [];
            popupCtrl.modalTitle = "Create new area";
            popupCtrl.user.id = guid();
            popupCtrl.userRoles.push("f16ec6db-626d-4c27-8de0-3e7ce542c55f"); //Push regular role by default
        	//Guest role = 987148b1-afa8-4b33-8616-55861e5fd065
        }
        else {
        	for (var i = 0; i < popupCtrl.user.$user_role.length; i++) {
        		popupCtrl.userRoles.push(popupCtrl.user.$user_role[i].id);
        	}
            popupCtrl.modalTitle ='Edit user <span class="go-green">' + popupCtrl.user.email + '</span>';
        }

		//Image        
        popupCtrl.progress = {};
        popupCtrl.progress.image = 0;
        popupCtrl.files = {}
        popupCtrl.files.image = {}
        popupCtrl.uploadedFileName = "";
        popupCtrl.upload = function (file) {

        	if (file != null) {

        		popupCtrl.moveSuccessCallback = function (response) {
        			$timeout(function () {
        				popupCtrl.user.image = response.object.url;
        			}, 1);
        		}

        		popupCtrl.uploadSuccessCallback = function (response) {
        			var tempPath = response.object.url;
        			var fileName = response.object.filename;
        			var targetPath = "/fs/" + popupCtrl.user.id + "/" + fileName;
        			var overwrite = true;
        			webvellaAdminService.moveFileFromTempToFS(tempPath, targetPath, overwrite, popupCtrl.moveSuccessCallback, popupCtrl.uploadErrorCallback);
        		}
        		popupCtrl.uploadErrorCallback = function (response) {
        			alert(response.message);
        		}
        		popupCtrl.uploadProgressCallback = function (response) {
        			$timeout(function () {
        				popupCtrl.progress.image= parseInt(100.0 * response.loaded / response.total);
        			}, 0);
        		}
        		webvellaAdminService.uploadFileToTemp(file, "image", popupCtrl.uploadProgressCallback, popupCtrl.uploadSuccessCallback, popupCtrl.uploadErrorCallback);
        	}
        };
        popupCtrl.deleteImage = function () {
        	var filePath = popupCtrl.user.image;

        	function deleteSuccessCallback(response) {
        		$timeout(function () {
        			popupCtrl.progress.image = 0;
        			popupCtrl.user.image = "";
        			popupCtrl.files.image = null;
        		}, 0);
        		return true;
        	}

        	function deleteFailedCallback(response) {
        		ngToast.create({
        			className: 'error',
        			content: '<span class="go-red">Error:</span> ' + response.message,
        			timeout: 7000
        		});
        		return "validation error";
        	}

        	webvellaAdminService.deleteFileFromFS(filePath, deleteSuccessCallback, deleteFailedCallback);

        }


        /// EXIT functions
        popupCtrl.ok = function () {
        	popupCtrl.validation = {};
        	if (!popupCtrl.isUpdate) {
        		popupCtrl.user.password = popupCtrl.password;
				popupCtrl.user["$user_role.id"] = [];
        		popupCtrl.userRoles.forEach(function(role){
					 popupCtrl.user["$user_role.id"].push(role);
				});
				webvellaAdminService.createRecord("user",popupCtrl.user, successCallback, errorCallback);
            }
            else {
        		popupCtrl.user["$user_role.id"] = [];
        		popupCtrl.userRoles.forEach(function(role){
					 popupCtrl.user["$user_role.id"].push(role);
				});
				delete popupCtrl.user["$user_role"];
        		if (popupCtrl.password) {
        			popupCtrl.user.password = popupCtrl.password;
        		}
        		webvellaAdminService.updateRecord(popupCtrl.user.id,"user",popupCtrl.user, successCallback, errorCallback);
            } 
        };

        popupCtrl.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        /// Aux
        function successCallback(response) {
            ngToast.create({
                className: 'success',
                content: '<span class="go-green">Success:</span> ' + 'The user was successfully saved'
            });
            $uibModalInstance.close('success');
            webvellaRootService.GoToState($state.current.name, {});
        }

        function errorCallback(response) {
            var location = $location;
            //Process the response and generate the validation Messages
            webvellaRootService.generateValidationMessages(response, popupCtrl, popupCtrl.user, location);
        }


        $log.debug('webvellaAdmin>entities>createEntityModal> END controller.exec ' + moment().format('HH:mm:ss SSSS'));
    };



})();
