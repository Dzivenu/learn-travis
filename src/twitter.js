/**
 * From https://support.twitter.com/articles/101299#error:
 * 
 * Your username cannot be longer than 15 characters.
 * Your name can be longer (50 characters), but usernames are kept
 * shorter for the sake of ease.
 * 
 * A username can only contain alphanumeric characters
 * (letters A-Z, numbers 0-9) with the exception of underscores,
 * as noted above. Check to make sure your desired username doesn't
 * contain any symbols, dashes, or spaces.
 * 
 * Also support passing a leading @... since that's so common
 */
function validateUsername(twitterName) {
  if(!twitterName) {
    return null;
  }

  // Strip leading @ if present
  twitterName = twitterName.replace(/^@/, '');

  if(!(/^[A-Za-z0-9_]{1,15}$/.test(twitterName))) {
    return null;
  }

  return twitterName;
}

// From https://gist.github.com/jcsrb/1081548#gistcomment-1493078
function getProfileUrl(twitterName) {
  twitterName = validateUsername(twitterName);
  if(!twitterName) {
    return null;
  }
  return 'https://twitter.com/' + twitterName + '/profile_image?size=original';
}

exports.getProfileUrl = getProfileUrl;

exports.isValidName = function(name) {
  return !!validateUsername(name);
};
