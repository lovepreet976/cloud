module.exports = {
  formatFormErrors: function(errors) {
    formatted = {};
    errors.forEach(function(e) {
      formatted[e.param] = e.msg;
    });
    return formatted;
  },

  formatModelErrors: function(errors) {
    if (!Array.isArray(errors)) {
      console.error("Errors is not an array:", errors); // Debugging log
      return {}; // Return an empty object if errors isn't an array
    }
  
    let formatted = {};
    errors.forEach(function(e) {
      formatted[e.property] = e.msg;
    });
    return formatted;
  },

  loginRequired: function (req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/signin')
  }
}
