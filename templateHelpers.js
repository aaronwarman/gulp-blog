var nodePath = require('path');

module.exports=function(site) {
  return {
    path: function(relPath) {
      return nodePath.join(site.siteRoot,relPath);
    } 
  };
};
