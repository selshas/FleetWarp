This File is corrently being editing.

# FleetWarp
Fleet Warp. Full Stack Web Framework

# 0. Introduction

'Fleet-Warp' is a full stack web development framework which is a Package of client-side MVC pattern Javascript framework and server-side PHP RESTful API framework.


# 1. Client(Javascript)

Router and Templete Classes are the foundation of Fleet-Warp's client-side framework. Those are the key Modules to create MVC Environment.


## 1.1. Features


### 1.1.1. Router

Router mainly controls views and controllers. To assemble complete page 'View', It allows HTML Files to be 'View Components'.
Using Router, you can assemble numerous HTML files to make complete page view, and asign it to be bound to specific URI. This process is called 'Routing' and a view assigned to specific URI is called a 'Route'.

#### 1.1.1.1. View

'View' is output source which will be rendered by the browser. It has been assembled by 'View Components', the HTML files fragmented as part of web page.

'View' is bound with unique URI that would be accessed by clients.

#### 1.1.1.2. Controller

Each Route has its own controllers. Controllers are Functions or External Script files, which would be executed when its attached route has been accessed.

Controllers are taking all buisiness logics. therefore, Your Javascript code will be written inside of controllers.


### 1.1.2. Templete Class

To print model data, Fleet-Warp is using Templete Class. In the constructor, It takes two arguments. first argument is the container, which is containing 'Model Expressions', second argument is the 'Model Object', the origination of data.
Model Expression is representing members of Model object. The expressions will be replaced by member variables of Model Object, when the templete instance is created.

Crerating templete instance will also connect model and view. changing values of Model Object is immediately reflect its changes to View. and changing of view(what commonly input tags do) will also change connected member of model object.

## 1.2. How to Install.

If you have downloaded Fleat-Warp from official web site, there is no specific installation methods. unzipped Fleet-Warp to your root directory. but one thing you should have to change is that. the value 'href' of <base> tag in 'index.html' must be set to path of your project root path. and don't forget it must have '/' as last character.



# 2. Server(PHP)

Fleet-Warp's server-side framework is RESTful API framework. it basically provide a function for http requests.

## 2.1. Features


### 2.1.1 Resource

Instances of URI Class are representing Resources. Resource is the core element of RESTful API. Instancing URI Class immediately create a server resource.

#### 2.1.1.1 URI Class

--being writing

#### 2.1.1.2 HTTPMethod

--being writing


## 2.3 How to Install.

Just upload unzipped files onto your web server.


# 3.Technical Support

Unfortunetly, FleetWarp is not completed yet. therefore actual user might need dev supports or newer updated version.
If you have a question, please visit our forum or GitHub or contact personally.

# 4.Contact

E-Mail : selshas@gmail.com

GitHub : https://github.com/selshas/FleetWarp
