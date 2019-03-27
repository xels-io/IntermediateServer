Xels BlockExplorer API
===============

http://blockexplorer.xels.io/

BlockExplorer API Implementation in Nodejs
-------------------------------------------

Block Explorer is a website of the xelscoin to show detail , developed in Angular CLI with nodejs Server.  
Nodejs server is handling all api to serve data to client.The node can run on the Bitcoin and Xels networks.
To run this server, nodejs must be installed . 

How to install Node.js on Windows
The first steps in using Node.js is the installation of the Node.js libraries on the client system. To perform the installation of Node.js, perform the below steps;

Step 1 :
Go to the site https://nodejs.org/en/download/ and download the necessary binary files. In our example, we are going to the download the 32-bit setup files for Node.js.
Step 2 :
Double click on the downloaded .msi file to start the installation. Click the Run button in the first screen to begin the installation.
Step 3 :
In the next screen, click the "Next" button to continue with the installation. 

Test Node
===============

To see if Node is installed, open the Windows Command Prompt, Powershell or a similar command line tool, and type node -v. 
This should print a version number, so you’ll see something like this v0.10.35.

Test NPM
===============

To see if NPM is installed, type npm -v in Terminal. This should print NPM’s version number so you’ll see something like this 1.4.28

To run this server , clone or download from 

https://github.com/xels-io/IntermediateServer.git

Running a Node Server
------------------

Go to the path of folder using cmd propmt .

Run npm install.

This would install all necessary node library according to package.json.

Now run "node app.js" .

If you want to run forever this node server , install forever library by using 

"npm i forever" . To run with forever the command would be "forever start app.js"
