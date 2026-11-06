function staff_approve_status_num_to_word(d) {
  var show_status = ['', 'Pending', 'Approved', 'Reject', 'Re-Apply', 'Auditing', 'Revoke'];
  return show_status[d.audit_status];
}
