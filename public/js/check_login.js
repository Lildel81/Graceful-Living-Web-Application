const bcryptjs = (window.dcodeIO && window.dcodeIO.bcrypt) || window.bcrypt;
if (!bcryptjs) {
  console.error('bcryptjs failed to load. Check the CDN script order.');
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault(); // stop normal form submit

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const saltRounds = 16;
    const hashedPassword = bcryptjs.hashSync(password, saltRounds);

    console.log('Username: ', username);
    console.log("Password hash: ", hashedPassword);

    document.getElementById('msg').textContent = `User: ${username}, Hashed: ${hashedPassword}`;

})
