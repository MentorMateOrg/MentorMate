import express from "express";
import { authToken } from "../middleware/authToken.js";

const router = express.Router();

router.post("/activity", authToken, async (req, res) => {
  try {
    const { githubUrl } = req.body;

    if (!githubUrl) {
      return res.status(400).json({ message: "githubUrl is required" });
    }

    let username;
    try {
      username = extractUsernameFromUrl(githubUrl);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const githubData = await fetchGithubData(username);

    if (githubData.error) {
      return res.status(500).json({ message: githubData.error });
    }

    res.json(githubData);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch github data" });
  }
});

function extractUsernameFromUrl(githubUrl) {
  try {
    const url = new URL(githubUrl);
    if (url.hostname !== "github.com") {
      return { username: null, error: "Not a GitHub URL" };
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts.length === 0) {
      return { username: null, error: "Username not found in URL" };
    }

    return { username: pathParts[0], error: null };
  } catch (err) {
    return { username: null, error: "Invalid URL" };
  }
}

async function fetchGithubData(username) {
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return { error: "Github token not found" };
  }

  try {
    const userResponse = await fetch(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (!userResponse.ok) {
      return { error: `Failed to fetch user data: ${userResponse.status}` };
    }

    const userData = await userResponse.json();

    //Fetch the user's public repos
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!reposResponse.ok) {
      return { error: `Failed to fetch repos: ${reposResponse.status}` };
    }

    const reposData = await reposResponse.json();

    // Fetch organizations user belongs to
    const orgsResponse = await fetch(
      `https://api.github.com/user/${username}/orgs`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    const orgsData = orgsResponse.ok ? await orgsResponse.json() : [];

    //Fetch public repos from each organization
    const orgRepos = [];
    for (const org of orgsData) {
      try {
        const orgReposResponse = await fetch(
          `https://api.github.com/orgs/${org.login}/repos?type=public&per_page=10`,
          {
            headers: {
              Authorization: `token ${githubToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (orgReposResponse.ok) {
          const orgReposData = await orgReposResponse.json();
          orgRepos.push(...orgReposData);
        }
      } catch (err) {
        //Ignore errors from individual organizations
      }
    }

    const allRepos = [...reposData, ...orgRepos];

    // Fetch real commit data for contributions and streak
    const commitData = await fetchCommitData(username, allRepos, githubToken);

    //calculate data from the responses
    const topLanguage = getTopLanguage(allRepos);
    const topProject = getTopProject(allRepos);
    const contributionsThisMonth = commitData.contributionsThisMonth;
    const commitStreak = commitData.commitStreak;
    const badges = generateRealBadges(userData, allRepos);

    return {
      contributionsThisMonth,
      topLanguage,
      topProject,
      commitStreak,
      badges,
    };
  } catch (err) {
    return { error: "Github api error occurred" };
  }
}

function getTopLanguage(repos) {
  const languageCount = {};
  repos.forEach((repo) => {
    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
    }
  });
  const sortedLanguages = Object.entries(languageCount).sort(
    ([, a], [, b]) => b - a
  );
  return sortedLanguages.length > 0
    ? sortedLanguages[0][0]
    : "No language found";
}

function getTopProject(repos) {
  if (repos.length === 0) {
    return "No projects found";
  }

  //sort by stars, then by forks, then by name
  const sortedRepos = repos.sort((a, b) => {
    if (b.stargazers_count !== a.stargazers_count) {
      return b.stargazers_count - a.stargazers_count;
    }
    if (b.forks_count !== a.forks_count) {
      return b.forks_count - a.forks_count;
    }
    if (sortedRepos.length === 0) {
      return null;
    }
    return a.name.localeCompare(b.name);
  });
  return sortedRepos[0].name;
}

// Fetch real commit data from GitHub API
async function fetchCommitData(username, repos, githubToken) {
  try {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const startOfMonth = new Date(thisYear, thisMonth, 1).toISOString();

    let totalCommitsThisMonth = 0;
    const commitDates = [];

    // Fetch commits from the user's most active repositories (limit to 5 for performance)
    const activeRepos = repos.slice(0, 5);

    for (const repo of activeRepos) {
      try {
        // Fetch commits from this month for each repo
        const commitsResponse = await fetch(
          `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits?author=${username}&since=${startOfMonth}&per_page=100`,
          {
            headers: {
              Authorization: `token ${githubToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (commitsResponse.ok) {
          const commits = await commitsResponse.json();
          totalCommitsThisMonth += commits.length;

          // Collect commit dates for streak calculation

          commits.forEach((commit) => {
            if (
              commit.commit &&
              commit.commit.author &&
              commit.commit.author.date
            ) {
              commitDates.push(new Date(commit.commit.author.date));
            }
          });
        }
      } catch (repoError) {
        // Continue with other repos even if one fails
      }
    }

    // Calculate commit streak based on actual commit dates
    const commitStreak = calculateCommitStreakFromDates(commitDates);

    return {
      contributionsThisMonth: Math.max(totalCommitsThisMonth, 0),
      commitStreak: commitStreak,
    };
  } catch (error) {
    // Return fallback data if API calls fail
    return {
      contributionsThisMonth: 0,
      commitStreak: 0,
    };
  }
}

// Calculate commit streak from actual commit dates
function calculateCommitStreakFromDates(commitDates) {
  if (commitDates.length === 0) return 0;

  // Normalize dates to remove time component (keep only year, month, day)
  const normalizedDates = commitDates.map(
    (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
  );

  // Sort dates in descending order (most recent first)
  const sortedDates = normalizedDates.sort((a, b) => b - a);

  // Remove duplicates (same day commits) - now this actually works for same day
  const uniqueDates = sortedDates.filter((date, index, array) => {
    if (index === 0) return true;
    return date.getTime() !== array[index - 1].getTime();
  });

  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  const normalizedToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  let streak = 0;
  let currentDate = new Date(today);

  // Check if there's a commit today or yesterday to start the streak
  const mostRecentCommit = uniqueDates[0];

  const msInDay = 1000 * 60 * 60 * 24;

  const daysDiff = Math.floor((normalizedToday - mostRecentCommit) / msInDay);

  if (daysDiff > 1) {
    return 0; // Streak is broken if no commits in the last 2 days
  }

  // Count consecutive days with commits
  for (let i = 0; i < uniqueDates.length; i++) {
    const commitDate = uniqueDates[i];
    const expectedDate = new Date(currentDate);

    if (commitDate.getTime() === expectedDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break; // Streak is broken
    }
  }

  return streak;
}

// Generate badges based on user activity and achievements
function generateRealBadges(userData, reposData) {
  const badges = [];

  const repositoryMasterCount = 50;
  const activeDeveloperCount = 20;
  const gettingStartedCount = 5;

  // Repository count badges
  const repoCount = userData.public_repos || 0;
  if (repoCount >= repositoryMasterCount) {
    badges.push({
      name: "Repository Master",
      description: "50+ public repositories",
    });
  } else if (repoCount >= activeDeveloperCount) {
    badges.push({
      name: "Active Developer",
      description: "20+ public repositories",
    });
  } else if (repoCount >= gettingStartedCount) {
    badges.push({
      name: "Getting Started",
      description: "5+ public repositories",
    });
  }

  const popularDeveloperFollowers = 100;
  const communityMemberFollowers = 50;

  // Follower count badges
  const followers = userData.followers || 0;
  if (followers >= popularDeveloperFollowers) {
    badges.push({ name: "Popular Developer", description: "100+ followers" });
  } else if (followers >= communityMemberFollowers) {
    badges.push({ name: "Community Member", description: "50+ followers" });
  }

  // Star count badges

  const totalStars = reposData.reduce(
    (sum, repo) => sum + (repo.stargazers_count || 0),
    0
  );

  const starCollectorCount = 100;
  const risingStarCount = 50;

  if (totalStars >= starCollectorCount) {
    badges.push({ name: "Star Collector", description: "100+ total stars" });
  } else if (totalStars >= risingStarCount) {
    badges.push({ name: "Rising Star", description: "50+ total stars" });
  }

  // Language diversity badge

  const languages = new Set(
    reposData.map((repo) => repo.language).filter(Boolean)
  );

  const polyglotCount = 5;

  if (languages.size >= polyglotCount) {
    badges.push({
      name: "Polyglot",
      description: "Uses 5+ programming languages",
    });
  }

  // Account age badge
  const accountCreated = new Date(userData.created_at);

  totalDaysInYear = 365;

  const yearsActive = Math.floor(
    (new Date() - accountCreated) / (msInDay * totalDaysInYear)
  );

  const veteranDeveloperCount = 5;
  const experiencedDeveloperCount = 2;

  if (yearsActive >= veteranDeveloperCount) {
    badges.push({
      name: "Veteran Developer",
      description: "5+ years on GitHub",
    });
  } else if (yearsActive >= experiencedDeveloperCount) {
    badges.push({ name: "Experienced", description: "2+ years on GitHub" });
  }

  return badges.length > 0
    ? badges
    : [{ name: "New Developer", description: "Welcome to GitHub!" }];
}

export default router;
