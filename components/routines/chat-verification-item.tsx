import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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
  const [loading, setLoading] = React.useState<'approve' | 'reject' | null>(null);
  const badgeScale = React.useRef(new Animated.Value(1)).current;
  const sparkleOpacity = React.useRef(new Animated.Value(0.7)).current;
  
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
    : `https://storage.googleapis.com/habify-verification-photos/${rawImageUrl || ''}`;

  const isOwner = log.userId === currentUserId;
  const approvalCount = log.approvals?.length || 0;
  const rejectionCount = log.rejections?.length || 0;
  const requiredApprovals = log.requiredApprovals || 0;
  const approvedNames = (log.approvals || [])
    .map((voter) => (typeof voter === 'string' ? '' : voter.name || 'Member'))
    .filter(Boolean)
    .slice(0, 3);

  React.useEffect(() => {
    if (log.status !== 'approved') return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 1.08,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: 450,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const sparkle = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 0.55,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    sparkle.start();

    return () => {
      pulse.stop();
      sparkle.stop();
    };
  }, [badgeScale, log.status, sparkleOpacity]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.imageWrapper} 
        activeOpacity={0.9} 
        onPress={() => onPressImage && onPressImage(imageUrl)}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image} 
        />
        {log.status === 'approved' && (
          <Animated.View style={[styles.statusBadgeSuccess, { transform: [{ scale: badgeScale }] }]}>
            <Animated.View style={[styles.sparkleWrap, { opacity: sparkleOpacity }]}>
              <Ionicons name="sparkles" size={12} color="#fff" />
            </Animated.View>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.statusBadgeText}>Verified</Text>
          </Animated.View>
        )}
        {log.status === 'rejected' && (
          <View style={styles.statusBadgeError}>
            <Ionicons name="close-circle" size={16} color="#fff" />
            <Text style={styles.statusBadgeText}>Rejected</Text>
          </View>
        )}
      </TouchableOpacity>

      {!isOwner && isPending ? (
        userHasVoted ? (
          <View style={styles.votedStatusRow}>
             <Ionicons 
                name={userHasApproved ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={userHasApproved ? "#4ade80" : "#f87171"} 
              />
              <Text style={[styles.votedStatusText, { color: userHasApproved ? "#4ade80" : "#f87171" }]}>
                {userHasApproved ? 'Approved' : 'Rejected'}
              </Text>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn, !isPending && styles.disabledBtn]}
              onPress={handleReject}
              disabled={loading !== null || !isPending}
            >
              {loading === 'reject' ? (
                <ActivityIndicator size="small" color="#f87171" />
              ) : (
                <>
                  <Ionicons 
                    name={hasRejected ? "close-circle" : "close"} 
                    size={18} 
                    color={hasRejected ? "#f87171" : "rgba(248, 113, 113, 0.7)"} 
                  />
                  <Text style={[styles.btnText, { color: hasRejected ? "#f87171" : "rgba(248, 113, 113, 0.7)" }]}>
                    {hasRejected ? 'Rejected' : 'Reject'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.approveBtn, !isPending && styles.disabledBtn]}
              onPress={handleApprove}
              disabled={loading !== null || !isPending}
            >
              {loading === 'approve' ? (
                <ActivityIndicator size="small" color="#4ade80" />
              ) : (
                <>
                  <Ionicons 
                    name={hasApproved ? "checkmark-circle" : "checkmark"} 
                    size={18} 
                    color={hasApproved ? "#4ade80" : "rgba(74, 222, 128, 0.7)"} 
                  />
                  <Text style={[styles.btnText, { color: hasApproved ? "#4ade80" : "rgba(74, 222, 128, 0.7)" }]}>
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
            style={styles.summaryBadge}
            onPress={() => onViewVotes?.(log, 'approvals')}
            activeOpacity={0.7}
            disabled={approvalCount === 0}
          >
            <Ionicons name="checkmark-circle-outline" size={14} color="#4ade80" />
            <Text style={styles.summaryText}>
              {approvalCount}
              {requiredApprovals > 0 ? `/${requiredApprovals}` : ''} Approvals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.summaryBadge}
            onPress={() => onViewVotes?.(log, 'rejections')}
            activeOpacity={0.7}
            disabled={rejectionCount === 0}
          >
            <Ionicons name="close-circle-outline" size={14} color="#f87171" />
            <Text style={styles.summaryText}>{rejectionCount} Rejections</Text>
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
            <Text style={styles.progressText}>
              {approvalCount > 0 &&
                `${approvalCount}${requiredApprovals > 0 ? `/${requiredApprovals}` : ''} Approvals `}
              {rejectionCount > 0 && `${rejectionCount} Rejections`}
            </Text>
        </TouchableOpacity>
      )}
      {log.status === 'approved' && approvedNames.length > 0 && (
        <Text style={styles.approvedByText}>Approved by {approvedNames.join(', ')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    width: 240,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginBottom: 8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadgeSuccess: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  sparkleWrap: {
    marginRight: 1,
  },
  statusBadgeError: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
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
    borderWidth: 1,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  approveBtn: {
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  rejectBtn: {
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  disabledBtn: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  progressRow: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  progressText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  summaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  votedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  votedStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  approvedByText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontStyle: 'italic',
  },
  imageLoadingPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1,
  },
  imageLoadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
  },
});
