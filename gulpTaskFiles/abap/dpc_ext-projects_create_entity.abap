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
    call function '/ETSA/UI5_REPOSITORY_LOAD_HTTP'
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