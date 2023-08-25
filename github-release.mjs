import fs from 'fs';
import axios from 'axios'; // eslint-disable-line

// Check if the github username and token are defined
const githubUsername = process.env.AVIRAL_GITHUB_USERNAME;
const githubToken = process.env.AVIRAL_GITHUB_NPM_TOKEN;
if (githubUsername === undefined || githubToken === undefined) {
  console.error('Env variable AVIRAL_GITHUB_USERNAME or AVIRAL_GITHUB_NPM_TOKEN not found');
  process.exit(1);
}

// Declare the regex patterns that we will use to match Jira codes and issues descriptions from
// the changelog
const versionPattern = /^<a name="(.+)"><\/a>$/;
const featurePattern = /^\* feat\(\[(VAST-[0-9]*)].*: (.*)$/;
const fixPattern = /^\* fix\(\[(VAST-[0-9]*)].*: (.*)$/;

// Now read the package.json file to get the current version
fs.readFile('./package.json', 'utf8', (err, data) => {
  const parsedPackage = JSON.parse(data);
  // Now read the CHANGELOG.md file to get the version history generated by the changelog-cli
  fs.readFile('./CHANGELOG.md', 'utf8', (err2, changelog) => {
    const versionHistory = {};
    // Split the changelog into several lines and clean empty lines
    let lines = changelog.split('\n');
    lines = lines.filter((value) => value !== '');

    // Now iterate over the changelog file and parse all the versions and features
    // declared within each version
    let currentVersion = false;
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (versionPattern.test(line)) {
        const matches = versionPattern.exec(line);
                currentVersion = matches[1]; // eslint-disable-line
        if (!(currentVersion in versionHistory)) {
          versionHistory[currentVersion] = {
            features: [],
            fixes: [],
          };
        }
      }
      if (featurePattern.test(line)) {
        const matches = featurePattern.exec(line);
        versionHistory[currentVersion].features.push([matches[1], matches[2]]);
      }
      if (fixPattern.test(line)) {
        const matches = fixPattern.exec(line);
        versionHistory[currentVersion].fixes.push([matches[1], matches[2]]);
      }
    }

    // Check if the version declared in the package.json is present in the dict we created.
    // If it's not, then we have no feature to parse / include in the github changelog
    if (parsedPackage.version in versionHistory
            && (versionHistory[parsedPackage.version].features.length
                || versionHistory[parsedPackage.version].fixes.length)
    ) {
      // Create an array that will avoid including the same issue twice
      const issuesAlreadyIncluded = [];
      // Add a title to the changelog
      let releaseHTML = `<h1>Release Notes - VideoJS VAST Plugin - Version ${parsedPackage.version}</h1>`;

      if (versionHistory[parsedPackage.version].features.length) {
        releaseHTML += '<h2>Features</h2><ul>';
        // Iterate over the issues and add a new li to the HTML for each feature found
        // eslint-disable-next-line
                for (let index = 0; index < versionHistory[parsedPackage.version].features.length; index += 1) {
          const feature = versionHistory[parsedPackage.version].features[index];
          if (!issuesAlreadyIncluded.includes(feature[0])) {
            issuesAlreadyIncluded.push(feature[0]);
            releaseHTML += `<li>[<a href='#/${feature[0]}'>${feature[0]}</a>] - ${feature[1]}</li>`;
          }
        }
        // Close the HTML
        releaseHTML += '</ul>';
      }

      if (versionHistory[parsedPackage.version].fixes.length) {
        releaseHTML += '<h2>Fixes</h2><ul>';
        // Iterate over the issues and add a new li to the HTML for each feature found
        // eslint-disable-next-line
                for (let index = 0; index < versionHistory[parsedPackage.version].fixes.length; index += 1) {
          const fix = versionHistory[parsedPackage.version].fixes[index];
          if (!issuesAlreadyIncluded.includes(fix[0])) {
            issuesAlreadyIncluded.push(fix[0]);
            releaseHTML += `<li>[<a href=#/${fix[0]}'>${fix[0]}</a>] - ${fix[1]}</li>`;
          }
        }
        // Close the HTML
        releaseHTML += '</ul>';
      }

      // Now prepare the Github repository API URL
      let repoApiUrl = parsedPackage.repository.url.replace('https://github.com/', 'https://api.github.com/repos/');
      repoApiUrl = repoApiUrl.split('.');
      repoApiUrl.pop();
            repoApiUrl = repoApiUrl.join('.') + '/releases'; // eslint-disable-line

      // And finally, post the new release data to the Github API
      axios({
        method: 'post',
        url: repoApiUrl,
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
        auth: {
          username: githubUsername,
          password: githubToken,
        },
        data: {
          tag_name: parsedPackage.version,
          body: releaseHTML,
        },
      });
    }
  });
});
