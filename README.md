MediaViewer.App
===============

A media content management and sharing web application.

MediaViewer.App, built on Node.js, provides restful services to the front end [MediaViewer.UI](https://github.com/mtimmermann/MediaViewer.UI) website project.

This application uses the following core components: 
  [express](https://github.com/visionmedia/express), a web application framework.
  [mongoose](https://github.com/LearnBoost/mongoose), a MongoDB object modeling tool designed to work in an asynchronous environment.


## Prerequisites ##
[Node.js](http://nodejs.org/) must be installed in order to build this and run this app.

[MongoDB](http://www.mongodb.org/)

I am also using NGINX to serve up the static content the of the [MediaViewer.UI](https://github.com/mtimmermann/MediaViewer.UI) site, and handle proxy passes to this app (see the configuration and setup notes below).


## Configuration ##

Below is the basic configuration I'm using...

The nginx.conf file used for this project:
```
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;
    proxy_http_version 1.1;
    proxy_next_upstream error;

    upstream mediaviewer-services {
        server 127.0.0.1:5000;
        #server 127.0.0.1:5001;
        #server 127.0.0.1:5003;
    }

    server {
       listen       80;
       server_name  mediaviewer.dev;
       root         /opt/mark/www/mediaviewerui;
       client_max_body_size 20M;

       location / {
           #auth_request        /auth;
           #auth_request_set    $session_cookie $upstream_http_sessionid;
           #auth_request_set    $session_cookie_name $upstream_http_session_cookie_name;
           #log_subrequest  on;

           #error_page          401 /login/index.html;
           #index               index.html;
           index               index.html;

           #add_header          Set-Cookie $session_cookie_name=$session_cookie;
           #add_header          Cache-Control no-cache;
       }

       location /media/ {
           alias     /opt/mark/www/mediaviewermedia/;
       }

       location /services/v1/ {
           proxy_pass          http://mediaviewer-services/;
           proxy_pass_header   Server;
           proxy_set_header    Host $http_host;
           proxy_redirect      off;
           proxy_set_header    X-Real-IP $remote_addr;
           proxy_set_header    X-Scheme $scheme;
       }
    }
}
```

If installing NGINX, I've created a bash script to retrieve and build NGINX(v.1.5.6) located at /config/  run at your own risk (and always investigate a script, program, etc... before running).


/etc/hosts
```
127.0.0.1   mediaviewer.dev
```

Symlinks in /opt/mark/www/ :
```
mediaviewermedia -> ~/Projects/MediaViewer.App/media/
mediaviewerui -> ~/Projects/MediaViewer.UI/deploy/
```


## Setup ##
After NodeJS, MongoDB, and NGINX (or other) are installed...

Install the project dependencies:
**npm install**

Run the app
**node app.js**

