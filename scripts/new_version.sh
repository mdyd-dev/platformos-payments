#!/bin/bash

confirm() {
  # call with a prompt string or use a default
  read -r -p "${1:-Are you sure? [y/N]} " response
  case "$response" in
    [yY][eE][sS]|[yY])
      true
      ;;
    *)
      false
      ;;
  esac
}

current_version=`git describe --abbrev=0 --tags`

echo "Current version is $current_version"

next_version=$(echo $current_version | awk -F. -v OFS=. 'NF==1{print ++$NF}; NF>1{if(length($NF+1)>length($NF))$(NF-1)++; $NF=sprintf("%0*d", length($NF), ($NF+1)%(10^length($NF))); print}')

echo "Preparing zip file for version $next_version"
zip -rq "tmp/$next_version.zip" .  -x scrtipts -x tmp

confirm "Would you like to create new release tag? $next_version" && git tag $next_version
confirm "Would you like to push local tags to remote repository?" && git push --tags
confirm "Please upload ZIP file located in tmp/$next_version.zip in Partner Portal  https://portal.apps.near-me.com/pos_modules/53"





