// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title InsuranceContract
 * @dev Contrat principal pour la gestion décentralisée des assurances
 */
contract InsuranceContract {

    // Structure de données pour une police d'assurance
    struct Policy {
        address payable insured;        // Adresse de l'assuré
        uint256 coverageAmount;         // Montant de couverture
        uint256 premium;                // Prime mensuelle
        uint256 startDate;              // Date de début
        uint256 endDate;                // Date de fin
        bool isActive;                  // Statut actif/inactif
        uint256 balance;                // Solde du contrat
    }

    // Structure pour une déclaration de sinistre
    struct Claim {
        uint256 policyId;               // ID de la police concernée
        address claimant;               // Adresse du déclarant
        uint256 amountClaimed;          // Montant réclamé
        string ipfsHash;                // Hash IPFS des preuves
        bool isValidated;               // Sinistre validé ?
        bool isPaid;                    // Indemnisation payée ?
        uint256 declarationDate;        // Date de déclaration
    }

    // Variables d'état
    mapping(uint256 => Policy) public policies;
    mapping(uint256 => Claim) public claims;
    uint256 public policyCounter;
    uint256 public claimCounter;
    address public owner;

    // Événements
    event PolicyCreated(
        uint256 indexed policyId,
        address indexed insured,
        uint256 coverageAmount
    );

    event PremiumPaid(
        uint256 indexed policyId,
        uint256 amount,
        uint256 timestamp
    );

    event ClaimDeclared(
        uint256 indexed claimId,
        uint256 indexed policyId,
        uint256 amount,
        string ipfsHash
    );

    event ClaimValidated(
        uint256 indexed claimId,
        bool approved
    );

    event IndemnityPaid(
        uint256 indexed claimId,
        address indexed beneficiary,
        uint256 amount
    );

    // Modificateurs
    modifier onlyOwner() {
        require(msg.sender == owner, "Non autorise: seul le proprietaire");
        _;
    }

    modifier policyExists(uint256 _policyId) {
        require(_policyId > 0 && _policyId <= policyCounter, "Police inexistante");
        _;
    }

    modifier policyActive(uint256 _policyId) {
        require(policies[_policyId].isActive, "Police inactive");
        _;
    }

    // Constructeur
    constructor() {
        owner = msg.sender;
        policyCounter = 0;
        claimCounter = 0;
    }

    /**
     * @dev Créer une nouvelle police d'assurance
     * @param _coverageAmount Montant de la couverture
     * @param _premium Prime mensuelle
     * @param _duration Durée en secondes
     */
    function createPolicy(
        uint256 _coverageAmount,
        uint256 _premium,
        uint256 _duration
    ) public payable returns (uint256) {
        require(msg.value >= _premium, "Prime insuffisante");
        require(_coverageAmount > 0, "Montant de couverture invalide");

        policyCounter++;

        policies[policyCounter] = Policy({
            insured: payable(msg.sender),
            coverageAmount: _coverageAmount,
            premium: _premium,
            startDate: block.timestamp,
            endDate: block.timestamp + _duration,
            isActive: true,
            balance: msg.value
        });

        emit PolicyCreated(policyCounter, msg.sender, _coverageAmount);
        return policyCounter;
    }

    /**
     * @dev Payer une prime pour une police existante
     * @param _policyId ID de la police
     */
    function payPremium(uint256 _policyId)
        public
        payable
        policyExists(_policyId)
        policyActive(_policyId)
    {
        Policy storage policy = policies[_policyId];
        require(msg.sender == policy.insured, "Non autorise");
        require(msg.value >= policy.premium, "Montant insuffisant");

        policy.balance += msg.value;

        emit PremiumPaid(_policyId, msg.value, block.timestamp);
    }

    /**
     * @dev Déclarer un sinistre
     * @param _policyId ID de la police
     * @param _amount Montant réclamé
     * @param _ipfsHash Hash IPFS des documents de preuve
     */
    function declareClaim(
        uint256 _policyId,
        uint256 _amount,
        string memory _ipfsHash
    )
        public
        policyExists(_policyId)
        policyActive(_policyId)
        returns (uint256)
    {
        Policy memory policy = policies[_policyId];
        require(msg.sender == policy.insured, "Non autorise");
        require(_amount <= policy.coverageAmount, "Montant superieur a la couverture");
        require(block.timestamp <= policy.endDate, "Police expiree");

        claimCounter++;

        claims[claimCounter] = Claim({
            policyId: _policyId,
            claimant: msg.sender,
            amountClaimed: _amount,
            ipfsHash: _ipfsHash,
            isValidated: false,
            isPaid: false,
            declarationDate: block.timestamp
        });

        emit ClaimDeclared(claimCounter, _policyId, _amount, _ipfsHash);
        return claimCounter;
    }

    /**
     * @dev Valider un sinistre (appelé par l'expert/oracle)
     * @param _claimId ID du sinistre
     * @param _approved True pour approuver, false pour rejeter
     */
    function validateClaim(uint256 _claimId, bool _approved)
        public
        onlyOwner
    {
        require(_claimId > 0 && _claimId <= claimCounter, "Sinistre inexistant");

        Claim storage claim = claims[_claimId];
        require(!claim.isValidated, "Sinistre deja traite");

        claim.isValidated = true;

        emit ClaimValidated(_claimId, _approved);

        if (_approved) {
            _payIndemnity(_claimId);
        }
    }

    /**
     * @dev Payer l'indemnisation (fonction interne)
     * @param _claimId ID du sinistre
     */
    function _payIndemnity(uint256 _claimId) internal {
        Claim storage claim = claims[_claimId];
        require(claim.isValidated, "Sinistre non valide");
        require(!claim.isPaid, "Deja indemnise");

        Policy storage policy = policies[claim.policyId];
        require(policy.balance >= claim.amountClaimed, "Solde insuffisant");

        claim.isPaid = true;
        policy.balance -= claim.amountClaimed;

        // Transfert des fonds
        (bool success, ) = payable(claim.claimant).call{value: claim.amountClaimed}("");
        require(success, "Transfert echoue");

        emit IndemnityPaid(_claimId, claim.claimant, claim.amountClaimed);
    }

    /**
     * @dev Obtenir les détails d'une police
     */
    function getPolicy(uint256 _policyId)
        public
        view
        policyExists(_policyId)
        returns (
            address insured,
            uint256 coverageAmount,
            uint256 premium,
            uint256 startDate,
            uint256 endDate,
            bool isActive,
            uint256 balance
        )
    {
        Policy memory policy = policies[_policyId];
        return (
            policy.insured,
            policy.coverageAmount,
            policy.premium,
            policy.startDate,
            policy.endDate,
            policy.isActive,
            policy.balance
        );
    }

    /**
     * @dev Obtenir les détails d'un sinistre
     */
    function getClaim(uint256 _claimId)
        public
        view
        returns (
            uint256 policyId,
            address claimant,
            uint256 amountClaimed,
            string memory ipfsHash,
            bool isValidated,
            bool isPaid
        )
    {
        require(_claimId > 0 && _claimId <= claimCounter, "Sinistre inexistant");

        Claim memory claim = claims[_claimId];
        return (
            claim.policyId,
            claim.claimant,
            claim.amountClaimed,
            claim.ipfsHash,
            claim.isValidated,
            claim.isPaid
        );
    }

    /**
     * @dev Obtenir le solde du contrat
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
