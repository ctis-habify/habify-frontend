import { Routine } from '@/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    Platform,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CollaborativeGroupCardProps {
    routine: Routine;
    onPress?: (id: string) => void;
    accentColor?: string;
}

export const CollaborativeGroupCard: React.FC<CollaborativeGroupCardProps> = ({ 
    routine, 
    onPress,
    accentColor = '#E879F9' 
}) => {
    const {
        id,
        routineName,
        description,
        collaborativeKey,
        isPublic,
        lives = 0,
        streak = 0,
        startTime,
        endTime,
        rewardCondition,
        ageRequirement,
        genderRequirement,
        xpRequirement,
    } = routine;

    const formatTime = (time?: string) => {
        if (!time) return '--:--';
        return time.split(':').slice(0, 2).join(':');
    };

    const handleInvite = async () => {
        try {
            await Share.share({
                message: `Join my collaborative routine "${routineName}" on Habify! Use code: ${collaborativeKey}`,
                title: 'Habify Invitation',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleManageUsers = () => {
        Alert.alert("Manage Users", "Member management feature coming soon!");
    };

    return (
        <TouchableOpacity 
            style={styles.card} 
            activeOpacity={onPress ? 0.8 : 1}
            onPress={onPress ? () => onPress(id) : undefined}
            disabled={!onPress}
        >
            {/* Header: Title & Category */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{routineName || 'Unnamed Space'}</Text>
                </View>
                {(!!routine.categoryName || !!(routine as any).category) && (
                    <View style={{ marginRight: 8 }}>
                        <Text style={[styles.categoryText, { color: accentColor, opacity: 0.8 }]}>
                            {(typeof (routine as any).category === 'string' 
                                ? (routine as any).category 
                                : (routine as any).category?.name || routine.categoryName || ''
                            ).toUpperCase()}
                        </Text>
                    </View>
                )}
                    <View style={styles.keyPill}>
                        <Ionicons name={isPublic ? "lock-open" : "lock-closed"} size={12} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={[styles.categoryText, { color: isPublic ? accentColor : '#e2e8f0' }]}>
                            {isPublic ? 'PUBLIC' : 'PRIVATE'}
                        </Text>
                    </View>
            </View>

            {/* Description */}
            {!!description && (
                <Text style={styles.description} numberOfLines={2}>{description}</Text>
            )}

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Ionicons name="heart" size={16} color="#ef4444" />
                    <Text style={styles.statLabel}>Lives: </Text>
                    <Text style={styles.statValue}>{lives}</Text>
                </View>
                <View style={[styles.divider, { height: '60%' }]} />
                <View style={styles.statItem}>
                    <Ionicons name="flame" size={16} color="#f97316" />
                    <Text style={styles.statLabel}>Streak: </Text>
                    <Text style={styles.statValue}>{streak}</Text>
                </View>
                <View style={[styles.divider, { height: '60%' }]} />
                <View style={styles.statItem}>
                    <Ionicons name="time" size={16} color={accentColor} />
                    <Text style={styles.statValue}>{formatTime(startTime)} - {formatTime(endTime)}</Text>
                </View>
            </View>

            {/* Requirements Section */}
            {!!(rewardCondition || ageRequirement || (genderRequirement && genderRequirement !== 'na') || xpRequirement) && (
                <View style={styles.footer}>
                    {!!rewardCondition && (
                        <View style={styles.conditionItem}>
                            <Ionicons name="ribbon" size={16} color="#fbbf24" />
                            <Text style={styles.footerText} numberOfLines={1}>{rewardCondition}</Text>
                        </View>
                    )}
                    {!!ageRequirement && (
                        <View style={styles.conditionItem}>
                            <Ionicons name="calendar" size={16} color="#38bdf8" />
                            <Text style={styles.footerText} numberOfLines={1}>{ageRequirement}+ Age</Text>
                        </View>
                    )}
                    {!!(genderRequirement && genderRequirement !== 'na') && (
                        <View style={styles.conditionItem}>
                            <Ionicons name="person" size={16} color="#f472b6" />
                            <Text style={styles.footerText} numberOfLines={1}>
                                {genderRequirement.toUpperCase()}
                            </Text>
                        </View>
                    )}
                    {!!xpRequirement && (
                        <View style={styles.conditionItem}>
                            <Ionicons name="star" size={16} color="#fbbf24" />
                            <Text style={styles.footerText} numberOfLines={1}>{xpRequirement} XP</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Actions */}
            <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: 'rgba(232, 121, 249, 0.15)' }]} 
                    onPress={handleInvite}
                    activeOpacity={0.7}
                >
                    <Ionicons name="share-social" size={18} color="#E879F9" />
                    <Text style={[styles.actionBtnText, { color: '#E879F9' }]}>Invite</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]} 
                    onPress={handleManageUsers}
                    activeOpacity={0.7}
                >
                    <Ionicons name="people" size={18} color="#38bdf8" />
                    <Text style={[styles.actionBtnText, { color: '#38bdf8' }]}>Manage</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.5,
    },
    categoryTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    keyPill: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 12,
    },
    keyText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    description: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginLeft: 4,
    },
    statValue: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    divider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 8,
    },
    footer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingTop: 16,
        marginTop: 4,
    },
    conditionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    footerText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: 8,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
