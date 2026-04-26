import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { RoutineLog } from '@/types/routine';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ChatVerificationItemProps {
  log: RoutineLog;
  onApprove: (logId: number) => Promise<void>;
  onReject: (logId: number) => Promise<void>;
  onViewVotes?: (log: RoutineLog, tab: 'approvals' | 'rejections') => void;
  onPressImage?: (url: string) => void;
  currentUserId?: string;
}

export const ChatVerificationItem: React.FC<ChatVerificationItemProps> = ({ 
  log, 
  onApprove, 
  onReject,
  onViewVotes,
  onPressImage,
  currentUserId 
}) => {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const [loading, setLoading] = React.useState<'approve' | 'reject' | null>(null);
  const badgeScale = React.useRef(new Animated.Value(1)).current;
  const sparkleOpacity = React.useRef(new Animated.Value(0.7)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;
  
  const hasApproved = log.status === 'approved';
  const hasRejected = log.status === 'rejected';
  const isPending = !hasApproved && !hasRejected;

  const checkHasUser = (list?: (string | { id?: string })[], userId?: string) => {
    if (!userId || !list) return false;
    return list.some((item) => (typeof item === 'string' ? item : item?.id) === userId);
  };

  const userHasApproved = checkHasUser(log.approvals, currentUserId);
  const userHasRejected = checkHasUser(log.rejections, currentUserId);
  const userHasVoted = userHasApproved || userHasRejected;

  const handleApprove = async () => {
    setLoading('approve');
    try {
      await onApprove(log.id);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading('reject');
    try {
      await onReject(log.id);
    } finally {
      setLoading(null);
    }
  };

  const rawImageUrl = log.verificationImageUrl;
  const imageUrl = (rawImageUrl || '').startsWith('http') 
    ? (rawImageUrl as string)
    : `https://storage.googleapis.com/habify-photo-uploads/${rawImageUrl || ''}`;

  const isOwner = log.userId === currentUserId;
  const approvalCount = log.approvals?.length || 0;
  const rejectionCount = log.rejections?.length || 0;
  const requiredApprovals = log.requiredApprovals || 0;
  const approvedNames = (log.approvals || [])
    .map((voter) => (typeof voter === 'string' ? '' : voter.name || 'Member'))
    .filter(Boolean)
    .slice(0, 3);

  // Mini konfeti tanecikleri için rastgele pozisyonlar
  const miniSparkles = useMemo(() => [
    { top: -2, left: 10, scale: 0.8, delay: 0 },
    { top: 10, right: -4, scale: 1.1, delay: 200 },
    { bottom: 5, left: -6, scale: 0.9, delay: 400 },
    { bottom: -3, right: 15, scale: 0.7, delay: 600 },
  ], []);

  React.useEffect(() => {
    if (log.status !== 'approved') return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 1.15,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const sparkle = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    sparkle.start();
    glow.start();

    return () => {
      pulse.stop();
      sparkle.stop();
      glow.stop();
    };
  }, [badgeScale, log.status, sparkleOpacity, glowAnim]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.imageWrapper, 
          { backgroundColor: colors.surface, borderColor: colors.border },
          hasApproved && { borderColor: '#fbbf24', borderWidth: 2 }
        ]} 
        activeOpacity={0.9} 
        onPress={() => onPressImage && onPressImage(imageUrl)}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image} 
        />
        
        {hasApproved && (
           <Animated.View 
             style={[
               styles.verifiedGlow, 
               { 
                 borderColor: '#fbbf24', 
                 opacity: glowAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: [0.3, 0.8]
                 })
               }
             ]} 
           />
        )}

        {hasApproved && miniSparkles.map((s, i) => (
          <Animated.View 
            key={i} 
            style={[
              styles.miniSparkle, 
              s, 
              { 
                opacity: sparkleOpacity,
                transform: [{ scale: badgeScale.interpolate({
                  inputRange: [1, 1.15],
                  outputRange: [s.scale, s.scale * 1.3]
                }) }]
              }
            ]}
          >
            <Ionicons name="sparkles" size={14} color="#facc15" />
          </Animated.View>
        ))}

        {log.status === 'approved' && (
          <Animated.View style={[styles.statusBadgeSuccess, { backgroundColor: colors.success, transform: [{ scale: badgeScale }] }]}>
            <Animated.View style={[styles.sparkleWrap, { opacity: sparkleOpacity }]}>
              <Ionicons name="sparkles" size={12} color={colors.white} />
            </Animated.View>
            <Ionicons name="checkmark-circle" size={16} color={colors.white} />
            <Text style={[styles.statusBadgeText, { color: colors.white }]}>Verified</Text>
          </Animated.View>
        )}
        {log.status === 'rejected' && (
          <View style={[styles.statusBadgeError, { backgroundColor: colors.error }]}>
            <Ionicons name="close-circle" size={16} color={colors.white} />
            <Text style={[styles.statusBadgeText, { color: colors.white }]}>Rejected</Text>
          </View>
        )}
      </TouchableOpacity>

      {!isOwner && isPending ? (
        userHasVoted ? (
          <View style={[styles.votedStatusRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
             <Ionicons 
                name={userHasApproved ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={userHasApproved ? colors.success : colors.error} 
              />
              <Text style={[styles.votedStatusText, { color: userHasApproved ? colors.success : colors.error }]}>
                {userHasApproved ? 'Approved' : 'Rejected'}
              </Text>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.btn, 
                styles.rejectBtn, 
                { 
                  backgroundColor: `${colors.error}22`, 
                  borderColor: isDark ? `${colors.error}4D` : colors.error 
                },
                !isPending && styles.disabledBtn
              ]}
              onPress={handleReject}
              disabled={loading !== null || !isPending}
            >
              {loading === 'reject' ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <>
                  <Ionicons 
                    name={hasRejected ? "close-circle" : "close-outline"} 
                    size={20} 
                    color={colors.error} 
                  />
                  <Text style={[styles.btnText, { color: colors.error }]}>
                    {hasRejected ? 'Rejected' : 'Reject'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn, 
                styles.approveBtn, 
                { 
                  backgroundColor: `${colors.success}22`, 
                  borderColor: isDark ? `${colors.success}4D` : colors.success 
                },
                !isPending && styles.disabledBtn
              ]}
              onPress={handleApprove}
              disabled={loading !== null || !isPending}
            >
              {loading === 'approve' ? (
                <ActivityIndicator size="small" color={colors.success} />
              ) : (
                <>
                  <Ionicons 
                    name={hasApproved ? "checkmark-circle" : "checkmark-outline"} 
                    size={20} 
                    color={colors.success} 
                  />
                  <Text style={[styles.btnText, { color: colors.success }]}>
                    {hasApproved ? 'Approved' : 'Approve'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )
      ) : (
        <View style={styles.ownerSummaryRow}>
          <TouchableOpacity
            style={[styles.summaryBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onViewVotes?.(log, 'approvals')}
            activeOpacity={0.7}
            disabled={approvalCount === 0}
          >
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
            <Text style={[styles.summaryText, { color: colors.text }]}>
              {approvalCount}
              {requiredApprovals > 0 ? `/${requiredApprovals}` : ''} Approvals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.summaryBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onViewVotes?.(log, 'rejections')}
            activeOpacity={0.7}
            disabled={rejectionCount === 0}
          >
            <Ionicons name="close-circle-outline" size={14} color={colors.error} />
            <Text style={[styles.summaryText, { color: colors.text }]}>{rejectionCount} Rejections</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!isOwner && isPending && (approvalCount > 0 || rejectionCount > 0) && (
        <TouchableOpacity
          style={styles.progressRow}
          onPress={() =>
            onViewVotes?.(
              log,
              approvalCount >= rejectionCount ? 'approvals' : 'rejections',
            )
          }
          activeOpacity={0.7}
        >
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {approvalCount > 0 &&
                `${approvalCount}${requiredApprovals > 0 ? `/${requiredApprovals}` : ''} Approvals `}
              {rejectionCount > 0 && `${rejectionCount} Rejections`}
            </Text>
        </TouchableOpacity>
      )}
      {log.status === 'approved' && approvedNames.length > 0 && (
        <Text style={[styles.approvedByText, { color: colors.icon }]}>Approved by {approvedNames.join(', ')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    width: 220,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'visible', // Allow sparkles to overflow slightly
    marginBottom: 8,
    position: 'relative',
    borderWidth: 1.5,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 12,
  },
  verifiedGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 3,
    zIndex: 1,
  },
  miniSparkle: {
    position: 'absolute',
    zIndex: 5,
  },
  statusBadgeSuccess: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    zIndex: 10,
  },
  sparkleWrap: {
    marginRight: 1,
  },
  statusBadgeError: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 4,
  },
  approveBtn: {},
  rejectBtn: {},
  btnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  disabledBtn: {
    backgroundColor: 'transparent',
    opacity: 0.3,
  },
  progressRow: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  ownerSummaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  summaryBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '800',
  },
  votedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  votedStatusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  approvedByText: {
    marginTop: 6,
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  imageLoadingPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1,
  },
  imageLoadingText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
