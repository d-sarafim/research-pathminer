import torch
from torch import nn
from model.CodeVectorizer import CodeVectorizer


# Classifier distinguishing files between two projects based on code2vec vectorization for files.
class ProjectClassifier(nn.Module):

    def __init__(self, n_tokens, n_paths, dim):
        super(ProjectClassifier, self).__init__()
        self.vectorization = CodeVectorizer(n_tokens, n_paths, dim)
        self.classifier = nn.Linear(dim, 1)

    def forward(self, contexts, id, should_print, ls):
        vectorized_contexts = self.vectorization(contexts)
        ls.append(f'{id[0][:3]}, {id[0][4:12]}, {vectorized_contexts[0][0]}')
        if should_print:
            print(f'{id[0][:3]}, {id[0][4:12]}, {vectorized_contexts[0][0]}')
        predictions = torch.sigmoid(self.classifier(vectorized_contexts))
        predictions = predictions.squeeze(-1)
        return predictions
