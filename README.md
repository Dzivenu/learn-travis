[![Build Status](https://travis-ci.org/humphd/learn-travis.svg?branch=master)](https://travis-ci.org/humphd/learn-travis)

# Learn Travis

## Introduction

This is a small node.js example showing some practical ways to use [TravisCI](https://travis-ci.com/) for automation.

Our goal will be to create a simple web service that combines the [image-to-ascii](https://github.com/IonicaBizau/image-to-ascii) node.js module with [Twitter's profile image URLs](https://stackoverflow.com/questions/18381710/building-twitter-profile-image-url-with-twitter-user-id)

Using our web service, we should be able to use the following URL:

http://localhost:7000/profile/Twitter

And have our server download and turn this:

![@Twitter](test/Twitter.jpg)

into this:

```
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
fffffffffffffffffffffffffffffffffffLLfftfftfffffffffffffffff
ffffffffffffffffLCfffffffffffffLG88@@80GLLCCffffffffffffffff
ffffffffffffffff0@0CftffffffffG@@@@@@@@@@@8GLfffffffffffffff
ffffffffffffffff0@@@8GCffftftL@@@@@@@@@@@@0Cffffffffffffffff
fffffffffffffffff0@@@@@@80GCCG@@@@@@@@@@@@ftffffffffffffffff
ffffffffffffffffGG8@@@@@@@@@@@@@@@@@@@@@@8ffffffffffffffffff
ffffffffffffffffC@@@@@@@@@@@@@@@@@@@@@@@@Gtfffffffffffffffff
fffffffffffffffffL08@@@@@@@@@@@@@@@@@@@@8fffffffffffffffffff
ffffffffffffffffftL08@@@@@@@@@@@@@@@@@@8ffffffffffffffffffff
fffffffffffffffffffC8@@@@@@@@@@@@@@@@@0fffffffffffffffffffff
fffffffffffffffffftttLC0@@@@@@@@@@@@8Cffffffffffffffffffffff
ffffffffffffffffLCCGG08@@@@@@@@@@80Lffffffffffffffffffffffff
ffffffffffffffffLG08@@@@@@@@880GLfffffffffffffffffffffffffff
fffffffffffffffffttfffLLLLLfffftffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
```
## How we'll use TravisCI

[TravisCI](https://travis-ci.com/) can perform many different build, testing, deployment, and other automated tasks.  We'll use it to do a number of things:

* Recreate our environment per-commit, and make sure everything can be installed.
* Lint our code, looking for any problems in what we've written.
* Run our test suite, making sure new code doesn't break old expectations.

Our first step will be to authenticate on https://travis-ci.org/auth using our GitHub identity, and enable Travis to build our repository.  The process is discussed at length in https://docs.travis-ci.com/user/getting-started/.

Next, we need to tell [TravisCI](https://travis-ci.com/) what to do with our code once it clones our repository and checksout a particular commit.  We'll define as much of our project as "source code" in our repository as possible.  At first it might seem like it would be easier to just have lots of GUI settings in a web app to handle our configuration, tests, etc.  However, by "coding" our environment and automation settings, it makes it easier for us to version them, compare new vs. old versions, have more than one person author them (e.g., someone without full rights can still write them). 

[TravisCI](https://travis-ci.com/) will look for a special configuration file in our repository named `.travis.yml`.  This is a [YAML file](https://en.wikipedia.org/wiki/YAML) with confiuration information about our environment, language, scripts, etc.  We'll be adding to it as we go.

## Dependencies

Our first task will be to define and install our dependencies, both those we'll need for our code, and for our environment.  We're going to need use all of the following node modules:

* [express](https://www.npmjs.com/package/express) to create our web service
* [image-to-ascii](https://www.npmjs.com/package/image-to-ascii) to convert images to ASCII text
* [redis](https://www.npmjs.com/package/redis) to create a cache
* [jest](https://www.npmjs.com/package/jest) to write unit tests
* [supertest](https://www.npmjs.com/package/supertest) to help us write tests against our web service.
* [nock](https://www.npmjs.com/package/nock) to create mock (i.e., simulated) network responses in our tests from the Twitter API
* [eslint](https://www.npmjs.com/package/eslint) to lint our code
* [eslint-plugin-jest](https://www.npmjs.com/package/eslint-plugin-jest) to integrate our linting with our jest tests.

In node the common way to install these dependencies is to define them in a `package.json` file, each with an associated [version number or range](https://docs.npmjs.com/getting-started/semantic-versioning):

```
  "dependencies": {
    "express": "^4.16.2",
    "image-to-ascii": "^3.0.9",
    ...
  }
```

We can further divide these up into dependencies you need in order to run our web service vs. those you need to *develop* it:

```
  "dependencies": {
    "express": "^4.16.2",
    "image-to-ascii": "^3.0.9",
    ...
  },
  "devDependencies": {
    "eslint": "^4.11.0",
    "eslint-plugin-jest": "^21.3.2",
    ...
  }
```

Once we've defined all of our module dependencies and their versions, we can install them using the `npm` command:

```
npm install
```

This will parse the `package.json` file and look for the `dependencies` and `devDependencies` sections, installing each module that it finds into a `node_modules/` directory.

NOTE: you can also have `npm` automatically install *and* record your dependency information using the `--save` or `--save-dev` flags:

```
npm install --save express
npm install --save-dev eslint 
```

Doing so will cause your `package.json` file to get automatically updated with the proper module names and versions.

Once we've done this, any developer who wants to recreate our development/production environment can use:

```
npm install
``` 

This will download and save all necessary modules and proper versions to a local `node_modules/` directory.

This is also what we'll ask Travis to do.  Because we're building a node.js JavaScript based project, we can tell Travis (via the `.travis.yml` file) that this is a node project:

```yml
# 1. We don't need to use `sudo`, and can instead use containers for faster builds
sudo: false
# 2. This is a node.js JS project
language: node_js
# 3. These are the various versions of node.js we want to test against
node_js:
  - "6"
  - "7"
  - "8"
  - "node"
# 4. We'd like to cache our node_modules dir, because it won't change very often
cache:
  directories:
    - "node_modules"
```

Our `.travis.yml` file defines a few things here:

1. We aren't going to need to do any commands in our build using `sudo` (i.e., as `root`), can everything can be done with stock installed or addon packages via containers.  This will mean our builds start faster.  See the [docs for more info](https://docs.travis-ci.com/user/reference/overview/#Virtualization-environments).
2. We specify that we're writing a node.js project, which means Travis will use a standard `npm` style workflow to do things like `npm install` our dependencies, `npm test` to run our tests, etc.
3. We specify every version of node.js that we want to test against.  Maybe we're concerned with backward compatibility, and don't want to accidentally use code that isn't supported in an older version.  Or maybe we want to make sure that some dependency doens't break in a newer version of node.js.  See the [docs for more info](https://docs.travis-ci.com/user/languages/javascript-with-nodejs/#Specifying-Node.js-versions).
4. We specify any directories (or other aspects of our project) that we want to cache.  In this case, we don't want to bother re-downloading all our `node_modules/` data for every build, since they won't change that often.  See the [docs for more info](https://docs.travis-ci.com/user/languages/javascript-with-nodejs/#Caching-with-npm).

With this info added, we can `git commit` our `package.json` and `.travis.yml` and `git push origin master` to have our code go to GitHub, as well as TravisCI for our first build.

Your builds will be available at a URL of the following form:

https://travis-ci.org/[GitHub-Username]/[GitHub-Repo-Name]

For example, the URL for the repository you're looking at now is:

https://travis-ci.org/humphd/learn-travis

Within this, you can see a number of different historical and current views:

* [The most recent build](https://travis-ci.org/humphd/learn-travis) including 
* [All builds arranged in historical order](https://travis-ci.org/humphd/learn-travis/builds)

There are also special views for different branches and pull requests, which we're not using at the moment.  Each build will include a link for any/all node.js runtime versions you specify, in our case there's a link for each of `6, 7, 8, node`.  Clicking on any of these will give a complete log of everything that happened during the build, and whether it is still running (yellow), finished and passed (green), or failed (red).

For example, here's a [build that worked](https://travis-ci.org/humphd/learn-travis/jobs/308095672), and another that [failed](https://travis-ci.org/humphd/learn-travis/jobs/308095674) (due to timing issues).

## Linting

As we code, and as we invite our friends and colleagues to join us in writing code, it's common to want some help in making sure our coding style follows a set of standards.  Beyond syntax errors, and various anti-patterns, there isn't really a proper way to write code.  You might swear by using semicolons and 8-space indents, and I might play fast and loose with no-semicolons and 2-spaces.  There's also a bunch of practices that we might want to enforce, from remembering to eliminate `console.log` in our production code to catching duplicate keys in our object definitions.

Linting tools help us find and remove "lint," which are warnings, errors, annoyances, or inconsistencies in our code.  There are lots of options one can use, but the most popular for node.js is [eslint](https://eslint.org/).

> I already use eslint in my editor, why do I need to have it defined in the project

Great question! Remember how we said that we want to define as much of our project's practices and tools as "code" as we can?  Well, we don't want to rely on the fact that you use a linter with your editor, but one of our new developers doesn't.  We want consistency, and the only way to achieve that is to define it at the *source* in our repository.

I'm not going to teach every aspect of `eslint`, and instead would suggest that you take some time to look at the learning materials on https://eslint.org/docs/user-guide/getting-started.

What I'm most interested in now is how to tell TravisCI to lint our code on every commit.  This will be a three part process.

1. Define any dependencies we need for Travis to use eslint
2. Define a set of rules that we'll have eslint check against our code
3. Define a command that Travis can run to test our code for these rules

We've already dealt with 1. above when we specified our dependencies.  For 2. we'll create a file to hold our [eslint settings](https://eslint.org/docs/user-guide/configuring), named `.eslintrc.js`:

```js
module.exports = {
  env: {
    // We're running in a node.js environment
    node: true,
    // We're using the Jest testing library, and its global functions
    'jest/globals': true
  },
  extends: [
    'eslint:recommended'
  ],
  plugins: [
    'jest'
  ],
  rules: {
    // Custom eslint rules
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'eqeqeq': ['error', 'always'],

    'no-console': ['warn']
  }
};
```

Here we've done a few things:

1. Specified that we're going to be writing code in a node.js environment, with all the assumed globals that node.js provides (i.e., we don't want eslint erroring becuase it assumes some node.js global is actually an undefined variable we missed).
2. We're going to start with the [`eslint:recommended` rule set](https://eslint.org/docs/user-guide/configuring#using-eslintrecommended), and modify it as necessary.  This way we don't have to think of everything, and can rely on some good default rules.
3. We're going to override and/or define some of our own rules.  For example, we want to use 2-space indents, and `error` vs. `warn` when someone uses something else.  However, we'll just `warn` vs. `error` when someone forgets to remove a `console.log()`.  The [complete list of rules is available here](https://eslint.org/docs/rules/).

Finally, we need to automate `eslint` to run.  There are lots of ways to do this, but we'll use the standard method of defining an [`npm script`](https://docs.npmjs.com/misc/scripts).  We can define any script we want in our `package.json` and attach it to a name that can then be run with `npm run <script-name>`:

```
  "scripts": {
    "test": "npm run lint",
    "lint": "eslint src test"
  }
```

Here we've got two scripts defined: `test` and `lint`.  Why two?  Doesn't `test` just call `lint`?  Why not just have one?  The answer is flexibility.  We might want to `lint` our code without running other tests.  Also, we will eventually want to compose a number of scripts into a single `test` run for our whole test suite; `lint` will be the first part of this.

Now when TravisCI runs `npm test` in a build, it will run the `lint` command will will in turn run `eslint` on our `src/` and `test/` directories.

## Testing

### Why Test?

With our installation automated via `npm install`, and our code linting in place via `eslint`, it's time to move on to testing.

Testing as such is too large of a topic for us to cover in detail now.  Our goal is to get a set of automated tests running in Travis, and to have the result of those tests to get reported back to GitHub.

Why is this important?  First, we want to automate our test suite in order to guarantee that it gets run.  If we leave it up to manual processes, in all likelihood the burden to run the tests will often mean we choose not to do so.  We want to put the burden of running our tests on an automated process with infinite patience vs in the hands of people who are in a hurry.

Second, we want to automate our tests so that we can better support parallel development on a project by a large number of individuals.  We want to try and keep our source code in a working state (buildable, lint free, all tests pass).  When our tests break, it's usually a sign that something in our code is broken (broken tests can sometimes be the fault of the tests, not our code), and that we should investigate.  When we allow things to remain in a broken state, we waste everyone's time, because it becomes difficult to keep working on other things that may depend on the now broken code.

Writing tests for new features as well as bug fixes is a good habit for software projects (open or closed).  Having an easy to use and fast way to automatically run our tests and see the results helps to encourage this practice.

### Writing Some Tests

For the purposes of this example, we're going to use a few common node.js testing modules:

* [Jest](https://facebook.github.io/jest/)
* [Supertest](https://github.com/visionmedia/supertest)
* [Nock](https://github.com/node-nock/nock)

We'll write a variety of tests, all of which you can see in the `tests/` directory. Our tests will attempt to push our code in every direction possible, and try to deal with both acceptable and unacceptable data alike.  We'll also use a mix of real and simulated (i.e., mocked) API calls to twitter.com, to look at different ways of working with external resources under testing conditions.

Jest will be [responsible for running all of our tests](https://facebook.github.io/jest/docs/en/cli.html#content), something it does very well without much guidance.  However, as has been our way up to this point, we'll also provide an explicit set of configuration options in "code" that allow our testing environment to get versioned in git.

Jest can be [configured via additions to our `package.json`](https://facebook.github.io/jest/docs/en/configuration.html#content) file.  We'll provide a few configuration options to tell it what we'd like to happen when tests are run:

```
  "jest": {
    "verbose": true,
    "collectCoverage": true,
    "forceExit": true
  }
```

Here, we've told Jest to be `verbose` with its output (i.e., we'd like to see as much info on what's happening as possible), that we want it to collect test coverage data (i.e., to determine which parts of our code aren't getting tested), and that we always want it to quit when it's done (i.e., always report back a pass/fail vs. hanging for some reason).

Next we need to automate the running of Jest everytime we need our tests to run.  Like we did with `eslint`, we'll do that via an `npm` script in `package.json`:

```
 "scripts": {
    "lint": "eslint src test",
    "jest": "jest",
    "test": "npm run lint && npm run jest",
    ...
```

We've now got a series of `scripts` we can `run` via `npm`.  If we only want to lint our code we can use `npm run lint`.  If we only want to see our tests run, `npm run jest`.  And finally, if we want to run our entire suite of tests, we'll use `npm test`, which in turn runs each of the other two one after the other.

So what do we need to do in order to get Travis to run our `npm test` command? Nothing.  Our choice of `test` for this all-encompassing command was deliberate: `npm`-based node projects [assume that `npm test` is how you run the test suite](https://docs.npmjs.com/cli/test). And by extension, this is what Travis will do when it runs a node.js project via automation. By writing our tests in terms of the defaults assumed by the language, we've created a simple way for our project to get tested within the context of a developer's machine, but also via automation.

## Automatic Deployment of a Staging Server

There are lots of other things we could do automatically with Travis.  One final task we'll add is deployment.  It would be nice if we always had a working version of our `master` branch running on a public server, so we can test things.  Having a live "staging" server is a common approach projects take to make it easy to test things without having to build and run the latest code locally.

Lots of cloud providers will let you [deploy your code from Travis](https://docs.travis-ci.com/user/deployment), and most offer some kind of free version, which is perfect for testing out a staging server.  We'll use [Heroku](https://heroku.com) and their [free tier](https://www.heroku.com/free) (i.e., we won't spend any money on this).

After creating an account on [Heroku](https://heroku.com), and adding a new app named `learn-travis` via the [dashboard](https://devcenter.heroku.com/articles/heroku-dashboard), we'll [install the Heroku cli tool](https://devcenter.heroku.com/articles/heroku-cli) and the [the Travis cli tool](https://github.com/travis-ci/travis.rb#installation).  Using these we can securely [create a deployment config for Heroku](https://docs.travis-ci.com/user/deployment/heroku/).

The first step is to encrypt our authentication token, so that Travis can deploy on our behalf, but we won't store our password in GitHub:

```
$ travis encrypt $(heroku auth:token) --add deploy.api_key
```

And now my `.travis.yml` file contains the following:

```
deploy:
  provider: heroku
  api_key:
    secure: oFXC5D8PCoxn...(truncated due to length)
  app: learn-travis
```

This is the info Travis needs to deploy my code after a successful build (i.e., all tests pass).

Next I need to tell Heroku about the binary dependenies I need for the `image-to-ascii`.  It uses a number of libraries that need to exist in the operating system, all of which I'll add to an `Aptfile`:

```
graphicsmagick
libpng-dev
zlib1g-dev
libjasper-dev
libjasper1
```

Next I'll tell Heroku to add a [buildpack](https://devcenter.heroku.com/articles/buildpacks) to install my OS `apt-get` dependencies:

```
$ heroku git:remote -a learn-travis
$ heroku buildpacks:add --index 1 https://github.com/heroku/heroku-buildpack-apt
```

Finally, I'll include a [Procfile](https://devcenter.heroku.com/articles/procfile) to tell Heroku how to start our server.

```
web: node src/server.js
```

I can now push everything to GitHub, and Travis will take over.  My dependencies will get installed, my code linted, my tests run, and if all that works, then my app will get deployed to Heroku and I'll be able to access it here:

https://learn-travis.herokuapp.com/profile/Twitter

NOTE: if that URL doesn't work right away, it probably means that my "free" server isn't started yet (Heroku stops free servers when not in use for 30 mins, and restarts them when someone makes a new request).

You can see an example build that did everything I just mentioned here:

https://travis-ci.org/humphd/learn-travis/builds/309704482
