import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Globe } from 'lucide-react-native';
import {
  siInstagram, siX, siFacebook, siYoutube, siGithub, siTwitch,
  siTiktok, siSnapchat, siPinterest, siMastodon, siBluesky,
  siLetterboxd, siGoodreads, siReddit, siMedium, siSubstack,
  siOrcid, siResearchgate, siDevdotto, siStackoverflow,
  siTumblr, siBehance, siDribbble, siSpotify, siFlickr, siDeezer,
} from 'simple-icons';
import { SimpleIcon } from '../SimpleIcon';
import { THEME } from '../../constants/theme';
import { UserConfig } from '../../constants/config';
import { ContactWithDistance } from '../../types';

type ThemeType = typeof THEME;

interface ProfileNetworksProps {
  contact: ContactWithDistance;
  config: UserConfig;
  theme: ThemeType;
}

const SOCIAL_SHORTCUT_IDS = new Set(['instagram', 'twitter', 'facebook', 'linkedin']);

const KNOWN_NETWORK_NAMES: Record<string, string> = {
  instagram: 'Instagram', twitter: 'X', x: 'X', facebook: 'Facebook',
  linkedin: 'LinkedIn', tiktok: 'TikTok', snapchat: 'Snapchat',
  youtube: 'YouTube', github: 'GitHub', pinterest: 'Pinterest', twitch: 'Twitch',
  mastodon: 'Mastodon', bluesky: 'Bluesky',
  letterboxd: 'Letterboxd', curius: 'Curius', goodreads: 'Goodreads',
  reddit: 'Reddit', medium: 'Medium', substack: 'Substack',
  orcid: 'ORCID', researchgate: 'ResearchGate',
  devto: 'Dev.to', stackoverflow: 'Stack Overflow', tumblr: 'Tumblr',
  behance: 'Behance', dribbble: 'Dribbble', spotify: 'Spotify', flickr: 'Flickr',
  deezer: 'Deezer',
};

// Simple Icons path data keyed by lowercase network slug
const SIMPLE_ICON_PATHS: Record<string, string> = {
  instagram:     siInstagram.path,
  twitter:       siX.path,
  x:             siX.path,
  facebook:      siFacebook.path,
  youtube:       siYoutube.path,
  github:        siGithub.path,
  twitch:        siTwitch.path,
  tiktok:        siTiktok.path,
  snapchat:      siSnapchat.path,
  pinterest:     siPinterest.path,
  mastodon:      siMastodon.path,
  bluesky:       siBluesky.path,
  letterboxd:    siLetterboxd.path,
  goodreads:     siGoodreads.path,
  reddit:        siReddit.path,
  medium:        siMedium.path,
  substack:      siSubstack.path,
  orcid:         siOrcid.path,
  researchgate:  siResearchgate.path,
  devto:         siDevdotto.path,
  stackoverflow: siStackoverflow.path,
  tumblr:        siTumblr.path,
  behance:       siBehance.path,
  dribbble:      siDribbble.path,
  spotify:       siSpotify.path,
  flickr:        siFlickr.path,
  deezer:        siDeezer.path,
};

const formatNetworkName = (network: string) =>
  KNOWN_NETWORK_NAMES[network.toLowerCase()] ??
  (network.charAt(0).toUpperCase() + network.slice(1));

const getSocialUrl = (network: string, username: string) => {
  const n = network.toLowerCase();
  const known: Record<string, string> = {
    instagram:     `https://instagram.com/${username}`,
    twitter:       `https://x.com/${username}`,
    x:             `https://x.com/${username}`,
    facebook:      `https://facebook.com/${username}`,
    linkedin:      `https://linkedin.com/in/${username}`,
    tiktok:        `https://tiktok.com/@${username}`,
    snapchat:      `https://snapchat.com/add/${username}`,
    youtube:       `https://youtube.com/@${username}`,
    github:        `https://github.com/${username}`,
    pinterest:     `https://pinterest.com/${username}`,
    twitch:        `https://twitch.tv/${username}`,
    mastodon:      `https://mastodon.social/@${username}`,
    bluesky:       `https://bsky.app/profile/${username}`,
    letterboxd:    `https://letterboxd.com/${username}`,
    curius:        `https://curius.app/${username}`,
    goodreads:     `https://goodreads.com/${username}`,
    reddit:        `https://reddit.com/user/${username}`,
    medium:        `https://medium.com/@${username}`,
    substack:      `https://${username}.substack.com`,
    orcid:         `https://orcid.org/${username}`,
    researchgate:  `https://researchgate.net/profile/${username}`,
    devto:         `https://dev.to/${username}`,
    stackoverflow: `https://stackoverflow.com/users/${username}`,
    tumblr:        `https://${username}.tumblr.com`,
    behance:       `https://behance.net/${username}`,
    dribbble:      `https://dribbble.com/${username}`,
    spotify:       `https://open.spotify.com/user/${username}`,
    flickr:        `https://flickr.com/people/${username}`,
    deezer:        `https://deezer.com/profile/${username}`,
  };
  return known[n] ?? `https://${n}.com/${username}`;
};

export const ProfileNetworks = ({ contact, config, theme }: ProfileNetworksProps) => {
  const shortcutNetworks = new Set(
    config.profileActions
      .filter(a => a.enabled && SOCIAL_SHORTCUT_IDS.has(a.id as string))
      .map(a => a.id as string)
  );

  const extraSocials = contact.socials?.filter(
    s => !shortcutNetworks.has(s.network.toLowerCase())
  ) ?? [];

  if (extraSocials.length === 0) return null;

  return (
    <View style={[styles.section, { borderBottomColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Social Networks</Text>
      {extraSocials.map((social, index) => {
        const siPath = SIMPLE_ICON_PATHS[social.network.toLowerCase()];
        return (
          <TouchableOpacity
            key={`social-${index}`}
            style={styles.infoRow}
            onPress={() => Linking.openURL(getSocialUrl(social.network, social.username))}
          >
            <View style={styles.infoIconContainer}>
              {siPath
                ? <SimpleIcon path={siPath} size={20} color={theme.textMuted} />
                : <Globe size={20} color={theme.textMuted} />
              }
            </View>
            <View>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                {formatNetworkName(social.network)}
                {social.label && social.label !== 'default' && (
                  <Text style={{ color: theme.textMuted }}> ({social.label})</Text>
                )}
              </Text>
              <Text style={[styles.infoValue, { color: theme.primary }]}>{social.username}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: THEME.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: THEME.text,
  },
});
