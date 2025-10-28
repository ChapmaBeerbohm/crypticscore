// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title RatingManager - Privacy-preserving rating system
/// @notice Allows users to create multi-dimensional rating projects and submit encrypted ratings
/// @dev All ratings are stored as encrypted values (euint32) and can only be decrypted by authorized parties
contract RatingManager is SepoliaConfig {
    
    /// @notice Structure representing a rating project
    struct RatingProject {
        uint256 projectId;
        address creator;
        string name;
        string description;
        string[] dimensions;  // Dimension names (e.g., "Quality", "Service")
        uint8 scaleMax;       // Maximum rating value (e.g., 5, 10, 100)
        uint256 endTime;      // Unix timestamp when rating closes
        bool allowMultiple;   // Allow same user to rate multiple times
        bool ended;           // Manually ended by creator
        uint256 ratingCount;  // Total number of ratings submitted
    }
    
    /// @notice Structure representing an encrypted rating submission
    struct EncryptedRating {
        address rater;
        uint256 timestamp;
    }
    
    // State variables
    mapping(uint256 => RatingProject) public projects;
    mapping(uint256 => EncryptedRating[]) private projectRatings;
    mapping(uint256 => mapping(address => bool)) public hasRated;
    mapping(uint256 => mapping(uint256 => euint32[])) private ratingScores; // projectId => ratingIndex => scores
    uint256 public projectCount;
    
    // Events
    event RatingProjectCreated(
        uint256 indexed projectId,
        address indexed creator,
        string name,
        uint8 dimensionCount,
        uint256 endTime
    );
    
    event RatingSubmitted(
        uint256 indexed projectId,
        address indexed rater,
        uint256 timestamp,
        uint256 ratingIndex
    );
    
    event ProjectEnded(uint256 indexed projectId);
    
    // Errors
    error ProjectNotFound();
    error ProjectAlreadyEnded();
    error AlreadyRated();
    error Unauthorized();
    error InvalidDimensions();
    error InvalidScale();
    error InvalidEndTime();
    error DimensionMismatch();
    
    /// @notice Creates a new rating project
    /// @param name Project name
    /// @param description Project description
    /// @param dimensions Array of dimension names
    /// @param scaleMax Maximum rating value (e.g., 5 for 1-5 stars)
    /// @param endTime Unix timestamp when rating closes
    /// @param allowMultiple Whether to allow multiple ratings from same user
    /// @return projectId The ID of the created project
    function createRatingProject(
        string memory name,
        string memory description,
        string[] memory dimensions,
        uint8 scaleMax,
        uint256 endTime,
        bool allowMultiple
    ) external returns (uint256 projectId) {
        if (dimensions.length == 0 || dimensions.length > 10) {
            revert InvalidDimensions();
        }
        if (scaleMax < 2 || scaleMax > 100) {
            revert InvalidScale();
        }
        if (endTime <= block.timestamp) {
            revert InvalidEndTime();
        }
        
        projectId = projectCount++;
        
        RatingProject storage project = projects[projectId];
        project.projectId = projectId;
        project.creator = msg.sender;
        project.name = name;
        project.description = description;
        project.dimensions = dimensions;
        project.scaleMax = scaleMax;
        project.endTime = endTime;
        project.allowMultiple = allowMultiple;
        project.ended = false;
        project.ratingCount = 0;
        
        emit RatingProjectCreated(
            projectId,
            msg.sender,
            name,
            uint8(dimensions.length),
            endTime
        );
    }
    
    /// @notice Submits an encrypted rating for a project
    /// @param projectId The ID of the project to rate
    /// @param encryptedScores Array of external encrypted scores (one per dimension)
    /// @param inputProof The proof for encrypted input validation
    function submitRating(
        uint256 projectId,
        externalEuint32[] calldata encryptedScores,
        bytes calldata inputProof
    ) external {
        RatingProject storage project = projects[projectId];
        
        if (project.creator == address(0)) revert ProjectNotFound();
        if (project.ended || block.timestamp > project.endTime) revert ProjectAlreadyEnded();
        if (!project.allowMultiple && hasRated[projectId][msg.sender]) revert AlreadyRated();
        if (encryptedScores.length != project.dimensions.length) revert DimensionMismatch();
        
        uint256 ratingIndex = projectRatings[projectId].length;
        
        // Store rating metadata
        projectRatings[projectId].push(EncryptedRating({
            rater: msg.sender,
            timestamp: block.timestamp
        }));
        
        // Store encrypted scores for each dimension
        euint32[] storage scores = ratingScores[projectId][ratingIndex];
        for (uint256 i = 0; i < encryptedScores.length; i++) {
            euint32 score = FHE.fromExternal(encryptedScores[i], inputProof);
            scores.push(score);
            
            // Allow contract to access the score
            FHE.allowThis(score);
        }
        
        // Mark user as having rated
        hasRated[projectId][msg.sender] = true;
        project.ratingCount++;
        
        emit RatingSubmitted(projectId, msg.sender, block.timestamp, ratingIndex);
    }
    
    /// @notice Allows project creator to decrypt all ratings for a specific dimension
    /// @param projectId The project ID
    /// @param dimensionIndex The dimension index (0 to dimensions.length-1)
    function allowCreatorDecryptDimension(
        uint256 projectId,
        uint8 dimensionIndex
    ) external {
        RatingProject storage project = projects[projectId];
        
        if (project.creator != msg.sender) revert Unauthorized();
        if (dimensionIndex >= project.dimensions.length) revert InvalidDimensions();
        
        uint256 ratingCount = projectRatings[projectId].length;
        for (uint256 i = 0; i < ratingCount; i++) {
            euint32[] storage scores = ratingScores[projectId][i];
            if (dimensionIndex < scores.length) {
                FHE.allow(scores[dimensionIndex], msg.sender);
            }
        }
    }
    
    /// @notice Batch authorization for creator to decrypt all dimensions
    /// @param projectId The project ID
    function allowCreatorDecryptAll(uint256 projectId) external {
        RatingProject storage project = projects[projectId];
        
        if (project.creator != msg.sender) revert Unauthorized();
        
        uint256 ratingCount = projectRatings[projectId].length;
        uint256 dimensionCount = project.dimensions.length;
        
        for (uint256 i = 0; i < ratingCount; i++) {
            euint32[] storage scores = ratingScores[projectId][i];
            for (uint256 j = 0; j < dimensionCount; j++) {
                if (j < scores.length) {
                    FHE.allow(scores[j], msg.sender);
                }
            }
        }
    }
    
    /// @notice Allows user to decrypt their own rating
    /// @param projectId The project ID
    function allowUserDecryptOwnRating(uint256 projectId) external {
        if (!hasRated[projectId][msg.sender]) revert Unauthorized();
        
        EncryptedRating[] storage ratings = projectRatings[projectId];
        
        // Find user's rating(s)
        for (uint256 i = 0; i < ratings.length; i++) {
            if (ratings[i].rater == msg.sender) {
                euint32[] storage scores = ratingScores[projectId][i];
                for (uint256 j = 0; j < scores.length; j++) {
                    FHE.allow(scores[j], msg.sender);
                }
            }
        }
    }
    
    /// @notice Manually ends a project (only creator)
    /// @param projectId The project ID to end
    function endProject(uint256 projectId) external {
        RatingProject storage project = projects[projectId];
        
        if (project.creator != msg.sender) revert Unauthorized();
        if (project.ended) revert ProjectAlreadyEnded();
        
        project.ended = true;
        
        emit ProjectEnded(projectId);
    }
    
    /// @notice Gets project information (public data only)
    /// @param projectId The project ID
    /// @return project The project struct
    function getProject(uint256 projectId) 
        external 
        view 
        returns (RatingProject memory project) 
    {
        return projects[projectId];
    }
    
    /// @notice Gets the number of ratings for a project
    /// @param projectId The project ID
    /// @return count The rating count
    function getProjectRatingCount(uint256 projectId) 
        external 
        view 
        returns (uint256 count) 
    {
        return projectRatings[projectId].length;
    }
    
    /// @notice Gets encrypted score handle for a specific rating and dimension
    /// @param projectId The project ID
    /// @param ratingIndex The rating index
    /// @param dimensionIndex The dimension index
    /// @return score The encrypted score handle
    function getRatingScore(
        uint256 projectId,
        uint256 ratingIndex,
        uint8 dimensionIndex
    ) external view returns (euint32 score) {
        return ratingScores[projectId][ratingIndex][dimensionIndex];
    }
    
    /// @notice Gets rating metadata (rater and timestamp)
    /// @param projectId The project ID
    /// @param ratingIndex The rating index
    /// @return rating The rating metadata
    function getRating(uint256 projectId, uint256 ratingIndex)
        external
        view
        returns (EncryptedRating memory rating)
    {
        return projectRatings[projectId][ratingIndex];
    }
    
    /// @notice Checks if a user has rated a project
    /// @param projectId The project ID
    /// @param user The user address
    /// @return Whether the user has rated
    function userHasRated(uint256 projectId, address user)
        external
        view
        returns (bool)
    {
        return hasRated[projectId][user];
    }
}

