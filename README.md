# Bricks &amp; Pieces helper

Requires:
* Jekyll
* yui-compressor
* PHP
* MySQL Database

#Install

##PHP part
1. Setup MySQL credidentials
	```
	cp config.mysql.php.default config.mysql.php
	nano config.mysql.php
	```

##Jekyll part
1. Build the site
	```
	JEKYLL_ENV=production jekyll build
	```

1. Compress Javascript
	```
	yui-compressor -v _site/assets/js/app.js -o _site/assets/js/app.min.js
	```

Site will be served form ``_site/``
