# FioriBuildEnv
A gulp-based build environment for Fiori development, including deployment to a ERP/Gateway server

# Requirements

- NodeJS v6.5 or greater (https://nodejs.org/en/)
- Ruby v2.0 or greater (http://rubyinstaller.org/)
- (Recommended) VS Code (https://code.visualstudio.com/)

# Features

- Lints JavaScript using eslint against the airbnb ruleset (a slightly modified set of rules).
- Lints SASS using SCSSLint.
- Transpiles JavaScript files to ES5 using Babel.
- Transpiles SASS to CSS and concatenates to a single CSS file.
- Builds JavaScript and CSS source maps for easier browser debugging.
- Minifies XML and HTML.
- Builds a Component-preload.js containing all XML and JavaScript files.
- Incudes a local browsersync development server with:
    - Easy service authentication,
    - Proxy middleware to forward OData service calls to your gateway server,
    - Automatic reloads on source code changes.
- One click deployment to an ERP/Gateway server.

# File Structure

```
|
├── /.vscode/                   # visual studio code config files
├── /gulpTaskFiles/             # files relating to the gulp tasks
|   ├── /tasks/                 # code for individual gulp tasks
|   └── /sap-config.json        # config file for the build processes
├── /node_modules/              # 3rd-party libraries and utilities
├── /src/                       # The source code of the application
│   ├── /index.html             # Base HTML page
│   ├── /js/                    # javascript/code related source files
│   │   ├── /controller/        # Controller JavaScript files
│   │   ├── /i18n/              # Internationalisation *.properties files
│   │   ├── /view/              # View XML files
│   │   ├── /Component.js       # Component definition file
│   │   └── /manifest.json      # Component manifest file
|   └── /css/                   # StyleSheet files (scss)
├── /build/                     # build directory
└── /zip/                       # deployment zips
```

# Gulp Tasks

### glup watch

- Launches an electron window to fetch login cookies,
- Starts the browsersync web server,
- Watches for changes to all buildable files, and
- Rebuilds files on change.

The browsersync server contains middleware to auto-proxy all requests to your desired endpoint.
This task will read config from the `/gulpTaskFiles/sap-config.json` file, which has the following options:

```JavaScript
{
    gateway: '<url>',            // url for the service endpoint and deployment server : '<scheme>://<host>:<port>'
    localDevPort: '<port>',      // the port that browsersync will run off (defaults to 3000)
    bspDeployTarget: '<name>',   // the name of the BSP application to which the auto deployment script will deploy to
    deploymentService: '<name>', // the name of the OData service which you setup (as per the deployment section below)
}
```

### gulp watch-no-server

Watches for changes to all buildable files and rebuilds on change.

### gulp build

Builds the source code into the build release version of the code,

# Deployment

1. Obtain a lock on the BSP application.
2. Run the gulp watch task.
3. Open ```http://localhost:3000/deploy``` in your browser (where 3000 is the dev port defined in your config)
4. Follow the prompts.


# Deployment to SAP

To automate deployment to SAP we need to:
 - copy a standard function module and make some changes
 - create an OData Service

## Function Module

Make a copy of the SAP Function Module  ```/UI5/UI5_REPOSITORY_LOAD_HTTP```  and its includes, calling it ```ZUI5_REPOSITORY_LOAD_HTTP```, then make the following changes:

Add a new importing parameter:
```abap
VALUE(IV_ZIP_FILE) TYPE  XSTRING DEFAULT ''
```

Add this code to line 171 to use the zip file passed in:
```abap
GET REFERENCE OF ev_log_messages INTO log_messages_ref.
  CREATE OBJECT sapui5_archive
    EXPORTING
      iv_url          = iv_url
      iv_zip_file     = iv_zip_file
      ir_log_messages = log_messages_ref.
```

In the copy of the include ```/UI5/LUI5_REPOSITORY_LOADD01``` change the constructor on line 135:
```abap
methods: constructor importing iv_url type string
         iv_zip_file type xstring optional
         ir_log_messages type ref to string_table,
```

Change the copy of the include ```/UI5/LUI5_REPOSITORY_LOADP01``` to use the zip file passed in:
```abap
*   Access zip file via http
    IF iv_zip_file IS NOT SUPPLIED.
*     ... Confirm Url
      cl_http_client=>create_by_url( EXPORTING  url = me->url
                                     IMPORTING  client = me->http_client
                                     EXCEPTIONS argument_not_found = 1
                                        plugin_not_active  = 2
                                        internal_error     = 3
                                        OTHERS             = 4  ).
      IF sy-subrc <> 0.
        me->ok = abap_false. me->error_message = text-011.
        REPLACE '%' IN me->error_message WITH me->url.
        APPEND me->error_message TO log_messages_ref->*.
        EXIT.
      ELSE.
        DATA: message TYPE string.
        message = text-012. APPEND message TO me->log_messages_ref->*.
        CONCATENATE '. ' iv_url INTO message RESPECTING BLANKS.
        APPEND message TO log_messages_ref->*.
      ENDIF.

*    ... Grep binary content of archive
      DATA: return_code TYPE sysubrc.
      http_client->send( EXCEPTIONS OTHERS = 1 ).
      http_client->receive( EXCEPTIONS OTHERS = 1 ).

      http_client->get_last_error(
        IMPORTING
          code = return_code
          message = message
      ).
      IF return_code IS NOT INITIAL.
        me->ok = abap_false. me->error_message = text-011.
        REPLACE '%' IN me->error_message WITH me->url.
        APPEND me->error_message TO me->log_messages_ref->*.
        EXIT.
      ENDIF.


         xstring = http_client->response->get_data( ).
       ELSE.
         xstring = iv_zip_file.
    ENDIF.
```


## OData Service

Create a new OData project in SAP transaction SEGW. Add an entity called Project with the following properties:
 - appName (Edm.String / Key)
 - zipFile (Edm.Binary)

Implement the 'Create' operation and use the following code:
```abap
method projects_create_entity.

    data:
      lt_log_messages      type string_table,
      ls_error_message     type string,
      lt_object_locks      type  cts_object_locks,
      lt_recording_entries type cts_recording_entries,
      ls_recording_entries type cts_recording_entry,
      lt_requests          type cts_requests,
      lv_success           type char1.

    field-symbols:
           <ls_log_messages> like line of lt_log_messages .

    io_data_provider->read_entry_data(
      importing
        es_data = er_entity ).

    " lets get the transport
    data(lv_transport) = er_entity-app_name.
    translate lv_transport to upper case.

    ls_recording_entries-object_entry-object_key-pgmid = 'R3TR'.
    ls_recording_entries-object_entry-object_key-object = 'WAPA'.
    ls_recording_entries-object_entry-object_key-obj_name = lv_transport.
    append ls_recording_entries to lt_recording_entries.

    " make sure we have an object lock
    call function 'CTS_WBO_API_CHECK_OBJECTS'
      exporting
        recording_entries = lt_recording_entries
        as4user           = sy-uname
      importing
        requests          = lt_requests
        object_locks      = lt_object_locks.

    if lt_object_locks is initial.
      raise exception type /iwbep/cx_mgw_busi_exception
        exporting
          textid            = /iwbep/cx_mgw_busi_exception=>business_error_unlimited
          message_unlimited = 'No open transports found. Create a transport and then give it another crack.'.
    endif.

    " upload the files to the bsp app
    call function 'ZUI5_REPOSITORY_LOAD_HTTP'
      exporting
        iv_zip_file                = er_entity-zip_file
        iv_url                     = 'NA'
        iv_sapui5_application_name = er_entity-app_name
        iv_workbench_request       = lt_object_locks[ 1 ]-lock_holder-req_header-trkorr
        iv_external_code_page      = 'Cp1252'
      importing
        ev_success                 = lv_success
        ev_log_messages            = lt_log_messages.
    loop at lt_log_messages assigning <ls_log_messages>.
      ls_error_message  = ls_error_message && ' ' && <ls_log_messages>.
    endloop.

    " didn't work?
    if lv_success <> 'S'.
      raise exception type /iwbep/cx_mgw_busi_exception
        exporting
          textid            = /iwbep/cx_mgw_busi_exception=>business_error_unlimited
          message_unlimited = ls_error_message.
    endif.

  endmethod.
  ```
