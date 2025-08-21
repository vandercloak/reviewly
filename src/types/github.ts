export interface GitHubUser {
  id: number;
  login: string;
  name?: string;
  email?: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  topics: string[];
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  user: GitHubUser;
  assignees: GitHubUser[];
  reviewers: GitHubUser[];
  requested_reviewers: GitHubUser[];
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description?: string;
  }>;
  head: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  base: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  html_url: string;
  diff_url: string;
  patch_url: string;
  created_at: string;
  updated_at: string;
  merged_at?: string;
  closed_at?: string;
  mergeable?: boolean;
  mergeable_state: string;
  additions: number;
  deletions: number;
  changed_files: number;
  commits: number;
}

export interface GitHubFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
  };
  url: string;
  html_url: string;
  comments_url: string;
  author?: GitHubUser;
  committer?: GitHubUser;
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
}

export interface GitHubReviewComment {
  id: number;
  pull_request_review_id?: number;
  diff_hunk: string;
  path: string;
  position?: number;
  original_position?: number;
  commit_id: string;
  original_commit_id: string;
  user: GitHubUser;
  body: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  pull_request_url: string;
  author_association: string;
  start_line?: number;
  original_start_line?: number;
  start_side?: 'LEFT' | 'RIGHT';
  line?: number;
  original_line?: number;
  side: 'LEFT' | 'RIGHT';
  subject_type?: 'line' | 'file';
  reactions: {
    total_count: number;
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface GitHubReview {
  id: number;
  user: GitHubUser;
  body?: string;
  state: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
  html_url: string;
  pull_request_url: string;
  author_association: string;
  submitted_at?: string;
  commit_id: string;
}

export interface GitHubDiff {
  files: GitHubFile[];
  commits: GitHubCommit[];
}