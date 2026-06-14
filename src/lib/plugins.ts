/**
 * Future Platform Architecture: Plugin Extensibility Contracts.
 * 
 * This file contains the architecture declarations and TypeScript interfaces
 * for extending Project Guardian's scanning, metadata extraction, backup sources,
 * and deployment platforms in future releases.
 */

import type { GitHubMetadata, RepoProvider } from "./types";

/**
 * Interface representing a Version Control Hosting Provider Plugin.
 * Enables integrating GitLab, Bitbucket, Azure DevOps, and Self-hosted Git setups.
 */
export interface HostingProviderPlugin {
  /** Unique plugin identifier, e.g. "gitlab" or "bitbucket" */
  id: string;
  
  /** Human-readable provider name, e.g. "GitLab Cloud" */
  name: string;

  /** Regex pattern to match the repository's Git remote URLs */
  urlMatchPattern: RegExp;

  /** Fetch remote metadata for a repository URL using the provider's API. */
  fetchRemoteMetadata(
    remoteUrl: string,
    authToken: string | null
  ): Promise<ProviderRepoMetadata | null>;
}

export interface ProviderRepoMetadata {
  exists: boolean;
  visibility: "public" | "private" | null;
  defaultBranch: string | null;
  lastPushDate: string | null;
  lastActivityDate: string | null;
  isArchived: boolean;
  htmlUrl: string | null;
}

/**
 * Interface representing a Cloud Deployment Platform Plugin.
 * Enables integrating Vercel, Netlify, Railway, AWS, Cloudflare, or Docker build setups.
 */
export interface DeploymentPlatformPlugin {
  /** Unique platform identifier, e.g. "vercel" or "railway" */
  id: string;

  /** Human-readable platform name, e.g. "Vercel deployments" */
  name: string;

  /** Check the active status of a deployment URL */
  checkDeploymentStatus(
    deploymentUrl: string,
    apiKey: string | null
  ): Promise<DeploymentStatus>;
}

export interface DeploymentStatus {
  online: boolean;
  status: "active" | "error" | "building" | "offline";
  lastDeployDate: string | null;
  environment: "production" | "preview" | "staging";
}

/**
 * Registry Manager for loading external plugin classes.
 */
export class PluginRegistry {
  private static hostingProviders = new Map<string, HostingProviderPlugin>();
  private static deploymentPlatforms = new Map<string, DeploymentPlatformPlugin>();

  /** Register a version control provider plugin */
  public static registerHostingProvider(plugin: HostingProviderPlugin): void {
    this.hostingProviders.set(plugin.id, plugin);
    console.log(`[PluginRegistry] Registered hosting provider: ${plugin.name} (${plugin.id})`);
  }

  /** Register a deployment checker plugin */
  public static registerDeploymentPlatform(plugin: DeploymentPlatformPlugin): void {
    this.deploymentPlatforms.set(plugin.id, plugin);
    console.log(`[PluginRegistry] Registered deployment platform: ${plugin.name} (${plugin.id})`);
  }

  /** Find the registered provider plugin that matches a remote URL */
  public static findProviderForUrl(url: string): HostingProviderPlugin | null {
    for (const provider of this.hostingProviders.values()) {
      if (provider.urlMatchPattern.test(url)) {
        return provider;
      }
    }
    return null;
  }

  /** Get a deployment platform plugin by ID */
  public static getDeploymentPlatform(id: string): DeploymentPlatformPlugin | null {
    return this.deploymentPlatforms.get(id) || null;
  }
}
