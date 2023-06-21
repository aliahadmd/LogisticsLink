const isAuthenticated = (req, res, next) => {
    if (req.session.role === 'customer' || req.session.role === 'subscriber' || req.session.role === 'admin') {
      next(); // User is authenticated, proceed to the next middleware or route handler
    } else {
      res.redirect('/signin'); // User is not authenticated, redirect to the signin page
    }
  };

  export {isAuthenticated}
  