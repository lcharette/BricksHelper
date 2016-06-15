# Bricks &amp; Pieces helper

Requires:
* Jekyll
* PHP
* MySQL Database
* yui-compressor (Optional, for production build) 

#Install

##PHP part
1. Setup MySQL credidentials
Copy the file ```config.mysql.php.default``` to ```config.mysql.php``` and edit the new file with you MySQL credidentials. 

2. Setup database
You'll find what you need in the ```db/``` folder.

##Jekyll part
###Dev Mode
First, why Jekyll?
* a) Because I'm lazy...
* b) Because I liked it
* c) Because when I started this I didn't need PHP... (Feel free to rebuild everything without Jekyll and submit a pull request if you're not lazy like me :p )

Second, if you just want to test the code, you can just build the website with ```jekyll build``` and the result (what you upload to the PHP server) will be in the ```_site/``` dorectory.

###Production Mode
The _production_ tag simply tell Jekyll to compile the statics pages while pointing to the compressed javascript file and it add my Google Analytics code for the production website. So :

1. Build the site
	```
	JEKYLL_ENV=production jekyll build
	```

1. Compress Javascript
	```
	yui-compressor -v _site/assets/js/app.js -o _site/assets/js/app.min.js
	```

Site will be ready for you in the ``_site/`` directory.

##Where to go next.
Questions about what when how and when is Bricks and Pieces Helper? [See this link](http://lego.bbqsoftwares.com) or [this other link](http://www.eurobricks.com/forum/index.php?showtopic=121587).

Want to contribute? Don't be shy! Submit a pull request and check how the issues section for what's left to do (hint, a lot!)
