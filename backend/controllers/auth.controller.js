module.exports.signup = async (req, res) => {
  res.json({ data: "You hit the signup endpoint" });
};

module.exports.login = async (req, res) => {
  res.json({ data: "You hit the login endpoint" });
};

module.exports.logout = async (req, res) => {
  res.json({ data: "You hit the logout endpoint" });
};
