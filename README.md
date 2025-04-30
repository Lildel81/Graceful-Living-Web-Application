<<<<<<< HEAD
# <strong>Graceful Living Express App with Mongo DB</strong>
=======
## <strong>Graceful Living Express App with Mongo DB</strong>

### <strong>Required dependencies for development.<strong>
<li>npm</li>
<li>express</li>
<li>cors</li>
<li>body-parser</li>
<li>mongoose</li>
<li>joi@17.13.3</li>
<li>joi-objectid@2.0.0</li>
<li>winsoton@2.4.0</li>
<li>express-ejs-layouts</li>
<li>dotenv</li>
<li>ejs</li>
<li>express-async-errors</li>
<li>nodemon</li>

### <strong>After npm is installed run:</strong>
<li>npm install express cors body-parser mongoose joi@17.13.3 joi-objectid@2.0.0 winston@3.17.0 express-ejs-layouts dotenv ejs express-async-errors</li>
>>>>>>> 4fbe1f87fe858779ef9ff019c0b0e7288fd38a3a

<li>npm install nodemon --save-dev</li>

<<<<<<< HEAD
## **ALWAYS REMEMBER TO PULL BEFORE YOU START CODING**
### <strong>Required dependencies for development.<strong>
<li>npm</li>
<li>express</li>
<li>cors</li>
<li>body-parser</li>
<li>mongoose</li>
<li>joi --version 17.13.3</li>
<li>joi-objectid --version 2.0.0</li>
<li>winsoton --version2.4.0</li>
<li>express-ejs-layouts</li>
<li>dotenv</li>
<li>ejs</li>
<li>express-async-errors</li>
<li>nodemon</li>

### <strong>After npm is installed run:</strong>
```bash
npm install express cors body-parser mongoose joi@17.13.3 joi-objectid@2.0.0 winston@3.17.0 express-ejs-layouts dotenv ejs express-async-errors
npm install nodemon --save-dev
npm install mongodb
```
=======
<li>npm install mongodb</li>

>>>>>>> 4fbe1f87fe858779ef9ff019c0b0e7288fd38a3a
<strong>Techinically</strong> Winston is installed, and dependencies are ready, but logging is currently not working. That still needs to be troubleshooted. 

### The app will be listening on <strong>127.0.0.1:8080</strong>
### <strong>To start it (after dependencies are installed) run:</strong>
<<<<<<< HEAD
```bash
npm start    #starts the batch file

#OR

node index.js    #runs one time

#For error verbosity run

node --verbose index.js
```
### <strong> Branches: </strong>
<li>The main branch is for fully working code</li>
<li>The master branch is what you should push to before merging with main branch.</li>

## **ALWAYS REMEMBER TO PULL BEFORE YOU START CODING**
<strong>To start coding in a new folder use: </strong>

```bash
git init   # initiates the git repositories locally
git clone https://github.com/Lildel81/Graceful-Living-Web-Application.git  #clones the repository to your local folder  **see cloning from a certain branch for more info**
```
<strong>To make sure your local folder is up to date with the repository use:</strong>
```bash
git pull --rebase origin master    #this is assuming origin is your push/fetch name if its not see "To push your work for the first time"
```
<strong>To push your work for the first time use:</strong>
```bash
git remote add origin https://github.com/Lildel81/Graceful-Living-Web-Application.git   #adds the github repository with label origin
git push --set-upstream origin master  #sets the upstream linking your origin and the repository's master branches
```
<strong>After that just use:</strong>
```bash
git push origin   #pushes up your code to the master branch.
```
<strong>To clone from a certain branch, the master for example, use:</strong>
```bash
git clone --branch master --single-branch <repo_url>
```
<strong>To check which branch your going to push to use:</strong>
```bash
git branch
```
<strong>To change to the master branch use:</strong>
```bash
git checkout master
```
<strong>To set upstream to the master branch (this only needs doing once per git folder) use:
```bash
git branch --set-upstream-to=origin/master master
```
<strong>To push changes to __only__ master use:   (after you have the upstream set)
```bash
git push origin master
```
<strong>To change the default branch to only the current branch your working in (after these steps it should be master) use:
```bash
git config --global push.default current
```
=======
<li>npm start</li>
or
<li>node index.js</li>

### <strong>For error verbosity run:</strong>
<li>node --verbose index.js</li>
>>>>>>> 4fbe1f87fe858779ef9ff019c0b0e7288fd38a3a

